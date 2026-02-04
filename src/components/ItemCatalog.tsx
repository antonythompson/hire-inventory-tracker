import { useState, useEffect } from 'preact/hooks';
import { api } from '../api/client';

interface CatalogItem {
  id: number;
  name: string;
  category: string | null;
  description: string | null;
  imageUrl: string | null;
  isActive: boolean;
}

interface Props {
  canManage?: boolean;
}

export function ItemCatalog({ canManage = true }: Props) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [filter, setFilter] = useState('');

  const loadItems = () => {
    setLoading(true);
    api.getCatalogItems()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadItems();
  }, []);

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];

  const filteredItems = items.filter((item) => {
    if (!filter) return true;
    return item.category === filter;
  });

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.deleteCatalogItem(id);
      loadItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (item: CatalogItem) => {
    try {
      await api.updateCatalogItem(item.id, { isActive: !item.isActive });
      loadItems();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-slate-800">Item Catalog</h2>
        {canManage && (
          <button
            onClick={() => setShowAdd(true)}
            class="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            + Add Item
          </button>
        )}
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div class="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('')}
            class={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              !filter
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat!)}
              class={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === cat
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Items list */}
      {loading ? (
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div class="text-center py-12 text-slate-400">
          No items in catalog
        </div>
      ) : (
        <div class="space-y-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              class={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 ${
                !item.isActive ? 'opacity-50' : ''
              }`}
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3 flex-1">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      class="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div class="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div class="flex-1 min-w-0">
                    <h3 class="font-medium text-slate-800 truncate">{item.name}</h3>
                    <p class="text-sm text-slate-500 truncate">
                      {item.category || 'No category'}
                      {item.description && ` • ${item.description}`}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  {canManage ? (
                    <>
                      <button
                        onClick={() => handleToggleActive(item)}
                        class={`px-2 py-1 rounded text-xs font-medium ${
                          item.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </button>
                      <button
                        onClick={() => setEditingItem(item)}
                        class="p-2 text-slate-400 hover:text-slate-600"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        class="p-2 text-slate-400 hover:text-red-600"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <span class={`px-2 py-1 rounded text-xs font-medium ${
                      item.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAdd || editingItem) && (
        <ItemModal
          item={editingItem}
          categories={categories as string[]}
          onClose={() => {
            setShowAdd(false);
            setEditingItem(null);
          }}
          onSave={() => {
            setShowAdd(false);
            setEditingItem(null);
            loadItems();
          }}
        />
      )}
    </div>
  );
}

interface ItemModalProps {
  item: CatalogItem | null;
  categories: string[];
  onClose: () => void;
  onSave: () => void;
}

function ItemModal({ item, categories, onClose, onSave }: ItemModalProps) {
  const [name, setName] = useState(item?.name || '');
  const [category, setCategory] = useState(item?.category || '');
  const [description, setDescription] = useState(item?.description || '');
  const [imageUrl, setImageUrl] = useState(item?.imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      setImageUrl(result.url);
    } catch (err) {
      console.error(err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (item) {
        await api.updateCatalogItem(item.id, {
          name,
          category: category || undefined,
          description: description || undefined,
          imageUrl: imageUrl || undefined,
        });
      } else {
        await api.createCatalogItem({
          name,
          category: category || undefined,
          description: description || undefined,
          imageUrl: imageUrl || undefined,
        });
      }
      onSave();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div class="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div class="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md">
        <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h3 class="font-semibold text-slate-800">
            {item ? 'Edit Item' : 'Add Item'}
          </h3>
          <button onClick={onClose} class="text-slate-400 hover:text-slate-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} class="p-4 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
              placeholder="e.g., Folding Chair"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={category}
              onInput={(e) => setCategory((e.target as HTMLInputElement).value)}
              list="categories"
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
              placeholder="e.g., Furniture"
            />
            <datalist id="categories">
              {categories.map((cat) => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onInput={(e) => setDescription((e.target as HTMLInputElement).value)}
              class="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
              placeholder="Optional description"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">
              Image
            </label>
            {imageUrl ? (
              <div class="relative inline-block">
                <img
                  src={imageUrl}
                  alt="Item preview"
                  class="w-24 h-24 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label class="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400 transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageUpload}
                  class="hidden"
                  disabled={uploading}
                />
                {uploading ? (
                  <div class="flex items-center gap-2 text-slate-500">
                    <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-500"></div>
                    <span class="text-sm">Uploading...</span>
                  </div>
                ) : (
                  <div class="text-center">
                    <svg class="w-8 h-8 text-slate-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span class="text-sm text-slate-500">Add image</span>
                  </div>
                )}
              </label>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !name}
            class="w-full bg-slate-800 text-white py-3 rounded-lg font-medium hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : item ? 'Save Changes' : 'Add Item'}
          </button>
        </form>
      </div>
    </div>
  );
}
