import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/auth";
import Layout from "../layout/Layout";
import BackButton from "../ui/BackButton";
import Input from "../ui/Input";
import { toast } from "react-hot-toast";
import { User, Key, Save, KeyRoundIcon } from "lucide-react";

const AccountPage = () => {
  const { currentUser, updateUser } = useAuth();
  const [details, setDetails] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (currentUser) {
      (() => {
        setDetails({
          first_name: currentUser.first_name || "",
          last_name: currentUser.last_name || "",
          email: currentUser.email || "",
          phone_number: currentUser.phone_number || "",
          date_of_birth: currentUser.date_of_birth || "",
        });
      })();
    }
  }, [currentUser]);

  const handleDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const onUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingDetails(true);
    try {
      await updateUser(details);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      const message = err?.errors?.[0]?.message || "An error occurred while updating profile";
      toast.error(message);
      console.error(err);
    } finally {
      setIsUpdatingDetails(false);
    }
  };

  const onUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("Passwords do not match");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const res = await authApi.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      if (res.status >= 200 && res.status < 300) {
        toast.success("Password changed successfully");
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      } else {
        toast.error("Failed to change password");
      }
    } catch (err: any) {
      const message = err?.errors?.[0]?.message || "An error occurred while changing password";
      toast.error(message);
      console.error(err);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!currentUser) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold">Please login to view this page</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full max-w-4xl py-8 flex flex-col gap-8 mx-auto">
        <div className="flex flex-col gap-2">
          <BackButton text="Back" />
          <h1 className="text-3xl font-bold">My Account</h1>
          <p className="text-base-content/70">Manage your profile and security settings</p>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Edit Details Section */}
          <section className="bg-base-100 p-6 rounded-2xl shadow-lg flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <User size={24} />
              </div>
              <h2 className="text-xl font-bold">Personal Details</h2>
            </div>

            <form onSubmit={onUpdateDetails} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                name="email"
                value={details.email}
                disabled
                helperText="Email cannot be changed"
              />

              <div className="flex gap-4">
                <Input
                  label="First Name"
                  type="text"
                  name="first_name"
                  value={details.first_name}
                  onChange={handleDetailsChange}
                  placeholder="Enter first name"
                />
                <Input
                  label="Last Name"
                  type="text"
                  name="last_name"
                  value={details.last_name}
                  onChange={handleDetailsChange}
                  placeholder="Enter last name"
                />
              </div>

              <Input
                label="Phone Number"
                type="tel"
                name="phone_number"
                value={details.phone_number}
                onChange={handleDetailsChange}
                placeholder="+1 (555) 000-0000"
              />

              <Input
                label="Date of Birth"
                type="date"
                name="date_of_birth"
                value={details.date_of_birth}
                onChange={handleDetailsChange}
              />

              <button
                type="submit"
                disabled={isUpdatingDetails}
                className={`btn btn-primary mt-4 ${isUpdatingDetails ? "loading" : ""}`}
              >
                {!isUpdatingDetails && <Save size={18} className="mr-2" />}
                {isUpdatingDetails ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>

          {/* Change Password Section */}
          <section className="bg-base-100 p-6 rounded-2xl shadow-lg flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Key size={24} />
              </div>
              <h2 className="text-xl font-bold">Security</h2>
            </div>

            <form onSubmit={onUpdatePassword} className="flex flex-col gap-4">
              <Input
                label="Current Password"
                type="password"
                name="current_password"
                value={passwordData.current_password}
                onChange={handlePasswordChange}
                placeholder="Enter Current Password"
                required
              />

              <div className="divider mt-2 mb-0">New Password</div>

              <Input
                label="New Password"
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                placeholder="Enter New Password"
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                placeholder="Confirm New Password"
                required
              />

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className={`btn btn-secondary mt-4 ${isUpdatingPassword ? "loading" : ""}`}
              >
                {isUpdatingPassword ? "Updating..." : (
                  <>
                    <KeyRoundIcon size={22} className="mr-2" /> Change Password
                  </>
                )}
              </button>
            </form>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default AccountPage;
