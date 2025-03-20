import { useRef, useState } from "react";
import { supabase } from '../supabase';

const FileUpload = () => {
  const fileInputRef = useRef(null);
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleUpload = async (e) => {
    e.preventDefault();

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    if (!user) {
      console.error("User must be logged in to upload!");
      return;
    }

    if (!fileInputRef.current || !fileInputRef.current.files || fileInputRef.current.files.length === 0) {
      console.error("No file selected!");
      return;
    }

    const file = fileInputRef.current.files[0];

    try {
      setUploading(true);
      const { data, error } = await supabase.storage
        .from("certuploads")
        .upload(`avatars/${Date.now()}-${file.name}`, file);

      if (error) throw error;

      const uploadedUrl = `https://your-supabase-url.supabase.co/storage/v1/object/public/certuploads/${data.path}`;
      setAvatarUrl(uploadedUrl);

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          username: username,
          website: website,
          avatar_url: uploadedUrl,
        });

      if (updateError) throw updateError;

      setMessage("Profile updated successfully!");
    } catch (error) {
      console.error("Upload error:", error.message);
      setMessage("Upload failed!");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1>Profile</h1>
      <form onSubmit={handleUpload}>
        <input
          type="file"
          ref={fileInputRef}
          accept="image/png, image/jpeg"
        />
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
        <input
          type="text"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Website"
        />
        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Profile"}
        </button>
      </form>

      {avatarUrl && (
        <div>
          <p>✅ Avatar uploaded successfully:</p>
          <img src={avatarUrl} alt="Avatar" width="150" />
        </div>
      )}

      {message && <p>{message}</p>}
    </div>
  );
};

export default FileUpload;