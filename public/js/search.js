class StudentSearch {
  constructor() {
    this.debounceTimer = null;
  }

  async search(query) {
    if (query.length < 2) return [];
    try {
      const res = await fetch(`/api/estudiantes/search?q=${encodeURIComponent(query)}`);
      return await res.json();
    } catch (err) {
      console.error('Error buscando estudiantes:', err);
      return [];
    }
  }

  debounceSearch(query, callback, delay = 300) {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(async () => {
      const results = await this.search(query);
      callback(results);
    }, delay);
  }
}
