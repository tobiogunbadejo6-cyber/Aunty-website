const API = {
  baseUrl: "/api",

  async request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers
    });

    const isJson = response.headers.get("content-type")?.includes("application/json");
    const data = isJson ? await response.json() : null;

    if (!response.ok) {
      throw new Error(data?.message || "Something went wrong.");
    }

    return data;
  }
};

window.API = API;
