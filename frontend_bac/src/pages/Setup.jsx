import React, { useState } from 'react';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';

function Setup() {
  const [shopData, setShopData] = useState({
    shopName: '',
    contact: '',
    logo: null
  });

  const handleParticlesInit = async (main) => {
    await loadFull(main);
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'logo') {
      setShopData({ ...shopData, logo: files[0] });
    } else {
      setShopData({ ...shopData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Save to localStorage for now
    localStorage.setItem('shopInfo', JSON.stringify(shopData));
    alert("Setup Complete! Redirecting to dashboard...");
    window.location.href = '/'; // redirect to main site
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center text-white font-[Cinzel]">
      {/* Particle BG */}
      <Particles
        id="tsparticles"
        init={handleParticlesInit}
        options={{
          fullScreen: { enable: true, zIndex: -1 },
          background: { color: "#0a0a2f" },
          particles: {
            number: { value: 40 },
            color: { value: "#ffd700" },
            opacity: { value: 0.4 },
            size: { value: { min: 1, max: 4 } },
            move: { enable: true, speed: 1 },
          },
          interactivity: {
            events: {
              onHover: { enable: true, mode: "repulse" },
              onClick: { enable: true, mode: "push" },
            },
            modes: {
              repulse: { distance: 80 },
              push: { quantity: 2 },
            },
          },
        }}
      />

      <div className="bg-white/10 backdrop-blur-lg p-8 rounded-xl shadow-lg w-[90%] max-w-xl text-white">
        <h1 className="text-3xl font-bold text-center text-[#ffd700] mb-6">Setup Your Shop</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            name="shopName"
            placeholder="Enter Shop Name"
            value={shopData.shopName}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white/20 rounded focus:outline-none"
            required
          />
          <input
            type="text"
            name="contact"
            placeholder="Enter Contact Info"
            value={shopData.contact}
            onChange={handleChange}
            className="w-full px-4 py-2 bg-white/20 rounded focus:outline-none"
            required
          />
          <input
            type="file"
            name="logo"
            accept="image/*"
            onChange={handleChange}
            className="w-full bg-white/10 rounded p-2 text-sm"
          />
          <button
            type="submit"
            className="w-full bg-[#ffd700] text-[#0a0a2f] font-bold py-2 rounded hover:opacity-90 transition"
          >
            Save & Continue
          </button>
        </form>
      </div>
    </div>
  );
}

export default Setup;
