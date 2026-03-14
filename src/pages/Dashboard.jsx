import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [message, setMessage] = useState("");
  const [imageMessages, setImageMessages] = useState({});

  useEffect(() => {
    if (!user) return;

    const fetchImages = async () => {
      setLoading(true);

      // 1️⃣ Get files from storage
      const { data: files } = await supabase.storage
        .from("photos")
        .list(user.id, { limit: 100 });

      // 2️⃣ Create signed URLs
      const signedUrls = await Promise.all(
        (files || []).map(async (file) => {
          const filePath = `${user.id}/${file.name}`;

          const { data: urlData } = await supabase.storage
            .from("photos")
            .createSignedUrl(filePath, 60 * 60);

          return {
            url: urlData?.signedUrl,
            filePath,
          };
        })
      );

      // 3️⃣ Fetch messages from DB
      const { data: messageData } = await supabase
        .from("photo_messages")
        .select("*")
        .eq("user_id", user.id);

      const messageMap = {};
      messageData?.forEach((item) => {
        messageMap[item.file_path] = item.text; // column name = text
      });

      setImageMessages(messageMap);
      setImages(signedUrls.filter((item) => item.url));
      setLoading(false);
    };

    fetchImages();
  }, [user]);

  const handleUpload = async () => {
    if (!file) return alert("Please select a file!");

    const filePath = `${user.id}/${file.name}`;

    // Upload file to storage
    const { error } = await supabase.storage
      .from("photos")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      alert("Upload error: " + error.message);
      return;
    }

    // Insert message into DB (column = text)
    // message feature temporarily disabled

    setMessage("");
    setShowModal(false);
    setFile(null);

    window.location.reload();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="dashboard-wrapper">
      <div className="stars"></div>

      {/* NAVBAR */}
      <header className="dashboard-header">
        <div className="logo">✦ LUMINA</div>

        <div className="nav-right">
          <span className="user-email">
            @{user?.email?.split("@")[0]}
          </span>

          <button className="upload-nav" onClick={() => setShowModal(true)}>
            + Upload
          </button>

          <button className="signout-btn" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </header>

      {/* HERO */}
      <div className="hero-section">
        <h1>Your Gallery</h1>
        <p className="sub-text">
          {images.length} PHOTOS • PRIVATE TO YOU
        </p>

        <input
          className="search-bar"
          type="text"
          placeholder="Search by message or filename..."
        />
      </div>

      {/* GALLERY */}
      {loading ? (
        <p className="status-text">Loading images...</p>
      ) : images.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🖼</div>
          <h3>No photos yet</h3>
          <p>Upload your first image to get started</p>

          <button
            className="primary-upload"
            onClick={() => setShowModal(true)}
          >
            Upload Photos
          </button>
        </div>
      ) : (
        <div className="gallery-grid">
          {images.map((item, idx) => {
            const imgMessage = imageMessages[item.filePath];

            return (
              <div key={idx} className="image-card">
                <img
                  src={item.url}
                  alt="user-upload"
                  onClick={() =>
                    setPreviewImage({
                      url: item.url,
                      message: imgMessage,
                    })
                  }
                />

                {imgMessage && (
                  <div className="image-message">
                    {imgMessage}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* UPLOAD MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Upload Your Image</h3>

            <input
              type="file"
              onChange={(e) => setFile(e.target.files[0])}
            />

            <textarea
              placeholder="Write a message about this image (optional)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="message-input"
            />

            <div className="modal-actions">
              <button onClick={handleUpload}>Upload</button>
              <button
                onClick={() => setShowModal(false)}
                className="cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW */}
      {previewImage && (
  <div
    className="preview-overlay"
    onClick={() => setPreviewImage(null)}
  >
    <div
      className="preview-content"
      onClick={(e) => e.stopPropagation()}
    >
      <img
        src={previewImage.url}
        alt="preview"
        className="preview-image"
      />

      {previewImage.message && (
        <div className="preview-message">
          {previewImage.message}
        </div>
      )}

      <button
        className="back-button"
        onClick={() => setPreviewImage(null)}
      >
        ← Back to Gallery
      </button>
    </div>
  </div>
)}


      {/* STYLES */}
      <style>{`
      html,
body,
#root {
  margin: 0 !important;
  padding: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
}

#root {
  margin: 0 !important;
  padding: 0 !important;
}

.dashboard-wrapper {
  width: 100vw !important;
  margin: 0 !important;
  left: 0;
}

 .dashboard-wrapper {
  position: relative;
  min-height: 100vh;
  padding: 40px 0; /* removed left/right padding */
  background: radial-gradient(circle at 20% 20%, #141a3a, #040811 70%);
  color: white;
  overflow-x: hidden;
  font-family: 'Inter', sans-serif;
}

        /* STARS */
        .stars {
          position: fixed;
          inset: 0;
          background:
            radial-gradient(2px 2px at 20% 30%, white, transparent),
            radial-gradient(2px 2px at 70% 20%, white, transparent),
            radial-gradient(2px 2px at 40% 80%, white, transparent),
            radial-gradient(1px 1px at 90% 50%, white, transparent);
          animation: moveStars 80s linear infinite;
          opacity: 0.3;
          z-index: 0;
        }

        @keyframes moveStars {
          from { transform: translateY(0); }
          to { transform: translateY(-1000px); }
        }

        /* ROTATING STAR */
        .logo {
          font-weight: 500;
          letter-spacing: 3px;
          font-size: 18px;
          color: #d4af37;
        }

        .logo::first-letter {
          display: inline-block;
          animation: rotateStar 6s linear infinite;
        }

        @keyframes rotateStar {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .dashboard-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 60px; /* adds spacing only inside header */
        position: relative;
        z-index: 2;
        }

        .nav-right {
          display: flex;
          gap: 15px;
          align-items: center;
        }

        .user-email {
          opacity: 0.6;
          font-size: 14px;
        }

        .upload-nav {
          background: transparent;
          border: 1px solid #d4af37;
          color: #d4af37;
          padding: 8px 18px;
          border-radius: 25px;
          cursor: pointer;
          transition: 0.3s;
        }

        .upload-nav:hover {
          background: #d4af37;
          color: black;
        }

        .signout-btn {
          background: transparent;
          border: none;
          color: #aaa;
          cursor: pointer;
        }

        .hero-section {
          text-align: center;
          margin-top: 80px;
          position: relative;
          z-index: 2;
        }

        .hero-section h1 {
          font-size: 56px;
          font-weight: 300;
          margin-bottom: 10px;
        }

        .sub-text {
          opacity: 0.6;
          letter-spacing: 2px;
          font-size: 12px;
          margin-bottom: 30px;
        }

        .search-bar {
          width: 420px;
          max-width: 90%;
          padding: 12px 20px;
          border-radius: 30px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.05);
          color: white;
          outline: none;
        }

        .empty-state {
          text-align: center;
          margin-top: 120px;
          position: relative;
          z-index: 2;
        }

        .empty-icon {
          font-size: 40px;
          margin-bottom: 20px;
          opacity: 0.7;
        }

        .empty-state h3 {
          font-weight: 400;
          margin-bottom: 10px;
        }

        .empty-state p {
          opacity: 0.6;
          margin-bottom: 30px;
        }

        .primary-upload {
          background: linear-gradient(90deg, #b8962e, #e0c36c);
          border: none;
          padding: 12px 30px;
          border-radius: 30px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 0 20px rgba(212,175,55,0.4);
        }

.gallery-grid {
  padding: 60px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
}
        .image-card img {
  width: 100%;
  height: 240px;
  object-fit: cover;
  border-radius: 18px;
  transition: transform 0.4s ease;
  cursor: pointer;
  display: block;
}

        .image-card {
  position: relative;
  overflow: hidden;
  border-radius: 18px;
}



        /* IMAGE PREVIEW */
        .preview-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 30;
          animation: fadeInPreview 0.3s ease;
          cursor: zoom-out;
        }

        /* MESSAGE OVERLAY */
.image-message {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 14px;
  font-size: 13px;
  background: linear-gradient(to top, rgba(0,0,0,0.85), transparent);
  color: #fff;

  opacity: 0;
  transform: translateY(30px);
  transition: all 0.35s ease;

  pointer-events: none;
}

.image-card:hover .image-message {
  opacity: 1;
  transform: translateY(0);
}

/* PREVIEW */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  overflow-y: auto;
}

.preview-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 90vw;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 12px;
}

.preview-message {
  margin-top: 20px;
  padding: 15px 25px;
  max-width: 600px;
  text-align: center;
  font-size: 15px;
  background: rgba(255,255,255,0.05);
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.1);
}

.back-button {
  margin-top: 25px;
  padding: 10px 24px;
  border-radius: 30px;
  border: 1px solid #d4af37;
  background: transparent;
  color: #d4af37;
  cursor: pointer;
  transition: 0.3s ease;
}

.back-button:hover {
  background: #d4af37;
  color: black;
}

.message-input {
  width: 100%;
  margin-top: 10px;
  padding: 10px;
  border-radius: 10px;
  resize: none;
}


        .preview-image {
          max-width: 90%;
          max-height: 90%;
          border-radius: 20px;
          box-shadow: 0 0 60px rgba(0,0,0,0.8);
          animation: zoomIn 0.3s ease;
        }

        @keyframes fadeInPreview {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes zoomIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* MODAL */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10;
        }

        .modal-card {
          background: #111;
          padding: 30px;
          border-radius: 20px;
          width: 350px;
          border: 1px solid #d4af37;
        }

        .modal-card h3 {
          margin-bottom: 20px;
          color: #d4af37;
        }

        .modal-actions {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }

        .modal-actions button {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
        }

        .modal-actions button:first-child {
          background: #d4af37;
        }

        .cancel {
          background: #444;
          color: white;
        }

        /* MESSAGE INPUT */

        /* PREVIEW OVERLAY */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  z-index: 999;
  overflow-y: auto;
}

/* PREVIEW CONTAINER */
.preview-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 90vw;
  max-height: 90vh;
}

/* IMAGE */
.preview-image {
  max-width: 100%;
  max-height: 70vh; /* prevents giant images */
  border-radius: 12px;
  object-fit: contain;
}

/* MESSAGE */
.preview-message {
  margin-top: 20px;
  padding: 15px 25px;
  max-width: 600px;
  text-align: center;
  font-size: 15px;
  background: rgba(255,255,255,0.05);
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,0.1);
}

/* BACK BUTTON */
.back-button {
  margin-top: 25px;
  padding: 10px 24px;
  border-radius: 30px;
  border: 1px solid #d4af37;
  background: transparent;
  color: #d4af37;
  cursor: pointer;
  font-weight: 500;
  transition: 0.3s ease;
}

.back-button:hover {
  background: #d4af37;
  color: black;
  box-shadow: 0 0 20px rgba(212,175,55,0.4);
}

      `}</style>
    </div>
  );
}