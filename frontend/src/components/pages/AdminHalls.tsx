import { useEffect, useState } from "react";
import Layout from "../layout/Layout";
import { dbApi } from "../../api/db";
import type { Hall, Seat, SeatType } from "../../api/types";
import toast from "react-hot-toast";
import Loading from "../ui/Loading";
import Card from "../ui/Card";
import { Plus, Edit2, Trash2, Check, X, ShieldAlert, Tv, Armchair } from "lucide-react";

const AdminHalls = () => {
  const [halls, setHalls] = useState<Hall[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<Hall | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [rowsCount, setRowsCount] = useState(8);
  const [colsCount, setColsCount] = useState(10);
  const [dolbyAtmos, setDolbyAtmos] = useState(false);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Seat management state
  const [activeSeatHall, setActiveSeatHall] = useState<Hall | null>(null);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [seatsLoading, setSeatsLoading] = useState(false);
  const [updatingSeatId, setUpdatingSeatId] = useState<number | null>(null);

  const fetchHalls = async () => {
    try {
      setLoading(true);
      const data = await dbApi.halls.list();
      setHalls(data);
    } catch {
      toast.error("Failed to load halls list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchHalls = async () => {
      try {
        setLoading(true);
        const data = await dbApi.halls.list();
        setHalls(data);
      } catch {
        toast.error("Failed to load halls list");
      } finally {
        setLoading(false);
      }
    };

    fetchHalls();
  }, []);

  const fetchSeats = async (hallId: number) => {
    setSeatsLoading(true);
    try {
      const data = await dbApi.seats.listByHall(hallId);
      setSeats(data);
    } catch {
      toast.error("Failed to load seats for this hall");
    } finally {
      setSeatsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingHall(null);
    setName("");
    setRowsCount(8);
    setColsCount(10);
    setDolbyAtmos(false);
    setIsModalOpen(true);
  };

  const openEditModal = (hall: Hall) => {
    setEditingHall(hall);
    setName(hall.name);
    setRowsCount(hall.rows_count);
    setColsCount(hall.cols_count);
    setDolbyAtmos(hall.dolby_atmos);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter a hall name");
      return;
    }

    if (rowsCount <= 0 || colsCount <= 0) {
      toast.error("Rows and columns must be greater than 0");
      return;
    }

    setActionLoading(true);
    try {
      if (editingHall) {
        // Edit only Name and Dolby Atmos (preventing dimensions changes since seats/bookings are bound)
        await dbApi.halls.update(editingHall.id, {
          name: name.trim(),
          dolby_atmos: dolbyAtmos,
          rows_count: editingHall.rows_count, // keep original
          cols_count: editingHall.cols_count, // keep original
        });
        toast.success(`Successfully updated hall: ${name}`);
        setIsModalOpen(false);
        fetchHalls();
      } else {
        // Create new Hall
        const newHall = await dbApi.halls.create({
          name: name.trim(),
          rows_count: rowsCount,
          cols_count: colsCount,
          dolby_atmos: dolbyAtmos,
        });

        // Automatically generate seats for the new hall
        toast.loading("Generating seating layout...", { id: "seat-gen" });
        const seatPromises = [];
        for (let r = 0; r < rowsCount; r++) {
          const rowLabel = String.fromCharCode(65 + r);
          for (let c = 1; c <= colsCount; c++) {
            const seatType = r >= rowsCount - 2 ? "VIP" : "REGULAR";
            seatPromises.push(
              dbApi.seats.create({
                hall: newHall.id,
                row_label: rowLabel,
                seat_number: c,
                grid_x: c,
                grid_y: r + 1,
                seat_type: seatType,
              })
            );
          }
        }
        await Promise.all(seatPromises);
        toast.dismiss("seat-gen");
        toast.success(`Successfully created hall "${name}" with ${rowsCount * colsCount} seats`);
        setIsModalOpen(false);
        fetchHalls();
      }
    } catch (err) {
      toast.dismiss("seat-gen");
      const errorObj = err as Record<string, unknown>;
      toast.error(
        typeof errorObj?.message === "string"
          ? errorObj.message
          : "An error occurred while saving the hall"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: number, hallName: string) => {
    setActionLoading(true);
    try {
      await dbApi.halls.delete(id);
      toast.success(`Successfully deleted hall: ${hallName}`);
      setDeleteConfirmId(null);
      fetchHalls();
    } catch {
      toast.error("Failed to delete hall. It might be linked to active screenings.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSeat = async (seat: Seat) => {
    setUpdatingSeatId(seat.id);
    const newType: SeatType = seat.seat_type === "VIP" ? "REGULAR" : "VIP";
    try {
      await dbApi.seats.update(seat.id, {
        ...seat,
        seat_type: newType,
      });
      setSeats((prev) =>
        prev.map((s) => (s.id === seat.id ? { ...s, seat_type: newType } : s))
      );
      toast.success(`Seat ${seat.row_label}${seat.seat_number} type updated to ${newType}`);
    } catch {
      toast.error("Failed to update seat status");
    } finally {
      setUpdatingSeatId(null);
    }
  };

  // Group seats by row for layout view
  const rowsMap: Record<string, Seat[]> = {};
  seats.forEach((seat) => {
    if (!rowsMap[seat.row_label]) {
      rowsMap[seat.row_label] = [];
    }
    rowsMap[seat.row_label].push(seat);
  });

  // Sort seats inside each row by grid_x
  Object.keys(rowsMap).forEach((rowLabel) => {
    rowsMap[rowLabel].sort((a, b) => a.grid_x - b.grid_x);
  });

  const sortedRowLabels = Object.keys(rowsMap).sort();

  return (
    <Layout fullWidth={true}>
      <div className="w-full p-8 pt-2 flex flex-col gap-6 animate-fade-in">
        {/* Header */}
        <header className="flex justify-between items-end flex-wrap gap-4 border-b border-base-content/10 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-base-content tracking-tight">Manage Halls</h1>
            <p className="text-base-content/70 font-medium">Add, edit, and delete cinema screen halls</p>
          </div>
          <button onClick={openAddModal} className="btn btn-primary font-bold flex gap-2">
            <Plus size={20} />
            Add New Hall
          </button>
        </header>

        {/* Content */}
        {loading ? (
          <div className="py-20">
            <Loading size="lg" />
          </div>
        ) : halls.length === 0 ? (
          <Card className="p-10 text-center flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-full bg-base-200 text-base-content/40">
              <Tv size={48} />
            </div>
            <div>
              <h3 className="text-xl font-bold">No halls found</h3>
              <p className="text-base-content/60 text-sm mt-1">
                Get started by creating a new hall.
              </p>
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="table table-zebra w-full bg-base-100 shadow-md rounded-2xl overflow-hidden border border-base-content/5">
              <thead>
                <tr className="text-base-content/60 bg-base-200/50">
                  <th className="font-extrabold text-sm uppercase tracking-wider pl-6">Hall Name</th>
                  <th className="font-extrabold text-sm uppercase tracking-wider text-center">Capacity</th>
                  <th className="font-extrabold text-sm uppercase tracking-wider text-center">Layout (Rows x Cols)</th>
                  <th className="font-extrabold text-sm uppercase tracking-wider text-center">Dolby Atmos</th>
                  <th className="font-extrabold text-sm uppercase tracking-wider text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {halls.map((hall) => (
                  <tr key={hall.id} className="hover border-b border-base-content/5">
                    <td className="font-bold text-base-content text-base pl-6">{hall.name}</td>
                    <td className="text-center font-bold text-base-content/85">
                      {hall.rows_count * hall.cols_count} seats
                    </td>
                    <td className="text-center font-semibold text-base-content/70">
                      {hall.rows_count} rows × {hall.cols_count} cols
                    </td>
                    <td className="text-center">
                      {hall.dolby_atmos ? (
                        <span className="badge badge-success badge-sm font-bold text-[10px]">YES</span>
                      ) : (
                        <span className="badge badge-ghost badge-sm opacity-60 text-[10px]">NO</span>
                      )}
                    </td>
                    <td className="text-right pr-6">
                      <div className="flex gap-2 justify-end items-center">
                        {deleteConfirmId === hall.id ? (
                          <div className="flex items-center gap-1 bg-error/10 p-1 rounded-xl border border-error/20">
                            <span className="text-xs font-bold text-error px-1 flex items-center gap-1">
                              <ShieldAlert size={12} /> Confirm Delete?
                            </span>
                            <button
                              onClick={() => handleDelete(hall.id, hall.name)}
                              className="btn btn-error btn-xs btn-circle text-error-content"
                              disabled={actionLoading}
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="btn btn-ghost btn-xs btn-circle"
                              disabled={actionLoading}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setActiveSeatHall(hall);
                                fetchSeats(hall.id);
                              }}
                              className="btn btn-ghost btn-xs btn-circle text-primary"
                              title="Manage Seating Layout & VIP Status"
                            >
                              <Armchair size={14} />
                            </button>
                            <button
                              onClick={() => openEditModal(hall)}
                              className="btn btn-ghost btn-xs btn-circle text-info"
                              title="Edit Hall"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(hall.id)}
                              className="btn btn-ghost btn-xs btn-circle text-error"
                              title="Delete Hall"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Form */}
        {isModalOpen && (
          <div className="modal modal-open">
            <div className="modal-box max-w-md bg-base-100 rounded-3xl p-6 border border-base-content/5 shadow-2xl">
              <h3 className="font-black text-xl mb-4 text-base-content">
                {editingHall ? "Edit Hall Details" : "Create New Hall"}
              </h3>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold">Hall Name</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered focus:outline-none focus:border-primary font-medium"
                    placeholder="e.g. Screen 3 / IMAX Deluxe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                {!editingHall && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">Rows Count</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={26}
                        className="input input-bordered focus:outline-none focus:border-primary font-semibold text-center"
                        value={rowsCount}
                        onChange={(e) => setRowsCount(parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text font-bold">Columns Count</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        className="input input-bordered focus:outline-none focus:border-primary font-semibold text-center"
                        value={colsCount}
                        onChange={(e) => setColsCount(parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>
                  </div>
                )}

                {editingHall && (
                  <div className="bg-base-200 p-3 rounded-2xl text-xs font-semibold text-base-content/70 flex gap-2">
                    <ShieldAlert size={16} className="text-warning shrink-0" />
                    <span>
                      Dimensions (Rows & Columns) cannot be edited once the hall is created to prevent breaking seat mapping and historical bookings.
                    </span>
                  </div>
                )}

                <div className="form-control mt-2">
                  <label className="label cursor-pointer justify-start gap-3 bg-base-200/50 p-3 rounded-2xl border border-base-content/5">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={dolbyAtmos}
                      onChange={(e) => setDolbyAtmos(e.target.checked)}
                    />
                    <span className="label-text font-bold">Dolby Atmos Audio System Support</span>
                  </label>
                </div>

                <div className="modal-action gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost font-bold rounded-2xl"
                    disabled={actionLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary font-bold px-6 rounded-2xl"
                    disabled={actionLoading}
                  >
                    {actionLoading ? <span className="loading loading-spinner"></span> : "Save Hall"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Seat Management Modal */}
        {activeSeatHall && (
          <div className="modal modal-open">
            <div className="modal-box max-w-3xl bg-base-100 rounded-3xl p-6 border border-base-content/5 shadow-2xl">
              <h3 className="font-black text-xl mb-1 text-base-content">
                Manage Seats for {activeSeatHall.name}
              </h3>
              <p className="text-sm opacity-70 mb-6">
                Click on any seat to toggle its type. Gold seats are VIP (carry a 1.5x price multiplier), gray seats are Regular.
              </p>

              {seatsLoading ? (
                <div className="py-20 flex justify-center">
                  <Loading size="lg" />
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {/* Screen visual */}
                  <div className="w-full flex flex-col items-center mb-2">
                    <div className="w-1/2 h-1 bg-base-content/30 rounded-full shadow-inner mb-1"></div>
                    <span className="text-[9px] uppercase tracking-widest font-black opacity-30">SCREEN</span>
                  </div>

                  {/* Seat Map Layout Grid */}
                  <div className="flex flex-col gap-3 items-center overflow-auto max-h-95 p-6 bg-base-200/40 rounded-3xl border border-base-content/5">
                    {sortedRowLabels.map((rowLabel) => (
                      <div key={rowLabel} className="flex flex-row items-center gap-4 w-max">
                        <span className="w-6 text-center font-bold opacity-30 text-xs">{rowLabel}</span>
                        <div className="flex flex-row gap-2.5">
                          {rowsMap[rowLabel].map((seat) => {
                            const isVIP = seat.seat_type === "VIP";
                            const isUpdating = updatingSeatId === seat.id;
                            return (
                              <button
                                key={seat.id}
                                disabled={isUpdating}
                                onClick={() => handleToggleSeat(seat)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[10px] transition-all border ${
                                  isVIP
                                    ? "bg-amber-500/15 text-amber-500 border-amber-500/40 hover:bg-amber-500/30"
                                    : "bg-base-100 hover:bg-primary/25 hover:text-primary text-base-content/75 border-base-content/10"
                                } ${isUpdating ? "animate-pulse opacity-50" : ""}`}
                                title={`Seat ${rowLabel}${seat.seat_number} (${seat.seat_type})`}
                              >
                                {seat.seat_number}
                              </button>
                            );
                          })}
                        </div>
                        <span className="w-6 text-center font-bold opacity-30 text-xs">{rowLabel}</span>
                      </div>
                    ))}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-row gap-6 justify-center text-xs font-bold pt-4 border-t border-base-content/5">
                    <div className="flex items-center gap-2 bg-base-200/50 px-3 py-1.5 rounded-xl border border-base-content/5">
                      <div className="w-5 h-5 bg-base-100 border border-base-content/10 rounded-md"></div>
                      <span className="opacity-70">Regular Seat (1.0x price multiplier)</span>
                    </div>
                    <div className="flex items-center gap-2 bg-amber-500/5 px-3 py-1.5 rounded-xl border border-amber-500/10">
                      <div className="w-5 h-5 bg-amber-500/15 border border-amber-500/40 rounded-md"></div>
                      <span className="text-amber-500">VIP Seat (1.5x price multiplier)</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-action mt-6">
                <button
                  onClick={() => setActiveSeatHall(null)}
                  className="btn btn-ghost font-bold rounded-2xl"
                  disabled={seatsLoading}
                >
                  Close Manager
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminHalls;
