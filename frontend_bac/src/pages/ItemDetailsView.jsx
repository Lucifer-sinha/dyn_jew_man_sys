import React from 'react';

function ItemDetailsView({ item, onEdit, onDelete, onCategoryClick }) {
  if (!item) return null;

  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-lg shadow-lg text-white max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Item Details</h2>
      <table className="w-full text-left mb-4">
        <tbody>
          <tr><th className="pr-4">Unique ID:</th><td>{item.unique_id}</td></tr>
          <tr><th className="pr-4">Name:</th><td>{item.name}</td></tr>
          <tr><th className="pr-4">Price:</th><td>₹{item.price}</td></tr>
          <tr><th className="pr-4">Weight:</th><td>{item.weight}g</td></tr>
          <tr><th className="pr-4">Stock:</th><td>{item.stock}</td></tr>
          <tr><th className="pr-4">Material:</th><td>{item.material_id}</td></tr>
          <tr><th className="pr-4">Description:</th><td>{item.description}</td></tr>
          <tr>
            <th className="pr-4">Category:</th>
            <td className="flex gap-2 flex-wrap">
  {item.full_category_path?.map((cat, idx) => {
    const handleCategoryClick = () => {
      onCategoryClick(cat);
    };
    
    return (
      <span
        key={idx}
        onClick={handleCategoryClick}
        className="bg-[#ffd700] text-[#0a0a2f] px-3 py-1 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80"
      >
        {cat}
      </span>
    );
  })}
</td>

          </tr>
        </tbody>
      </table>

      <div className="flex gap-4">
        <button
          onClick={() => onEdit(item)}
          className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-white"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(item.id)}
          className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded text-white"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default ItemDetailsView;
