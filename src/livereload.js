// NOTE(Nic): one-liner for enabling live-reload in development. Not included in production.
new EventSource("/esbuild").addEventListener("change", () => location.reload());
