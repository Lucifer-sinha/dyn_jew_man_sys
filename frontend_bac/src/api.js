const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000"; // Flask server URL


export const fetchItems = async () => {
    try {
        const response = await fetch(`${BASE_URL}/items`);
        return await response.json();
    } catch (error) {
        console.error("Error fetching items:", error);
        return [];
    }
};

export const addItem = async (item) => {
    try {
        const response = await fetch(`${BASE_URL}/add-item`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
        });
        return await response.json();
    } catch (error) {
        console.error("Error adding item:", error);
    }
};
