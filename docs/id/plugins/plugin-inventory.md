---
read_when:
    - Anda sedang memutuskan apakah sebuah plugin disertakan dalam paket npm inti atau diinstal secara terpisah
    - Anda sedang memperbarui metadata paket plugin bawaan atau otomatisasi rilis
    - Anda memerlukan daftar Plugin internal vs eksternal yang kanonis
summary: Inventaris Plugin OpenClaw yang dibuat secara otomatis, disertakan dalam core, dipublikasikan secara eksternal, atau hanya disimpan sebagai sumber.
title: Inventaris Plugin
x-i18n:
    generated_at: "2026-07-19T05:02:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b8a99bb683636d5fd4569f2ce7d6da5d560527af9684dcdd2f6176f4539bd81a
    source_path: plugins/plugin-inventory.md
    workflow: 16
---

# Inventaris Plugin

Halaman ini dihasilkan dari `extensions/*/package.json`, `openclaw.plugin.json`,
dan pengecualian paket npm root `files`. Buat ulang dengan:

```bash
pnpm plugins:inventory:gen
```

## Definisi

- **Paket npm inti:** terintegrasi ke dalam paket npm `openclaw` dan tersedia tanpa instalasi Plugin terpisah.
- **Paket eksternal resmi:** Plugin yang dikelola OpenClaw, tidak disertakan dalam paket npm inti, tetap tercantum dalam inventaris resmi ini, dan diinstal sesuai kebutuhan melalui ClawHub dan/atau npm.
- **Khusus checkout sumber:** Plugin lokal repositori yang tidak disertakan dalam artefak npm yang dipublikasikan dan tidak ditawarkan sebagai paket yang dapat diinstal.

Checkout sumber berbeda dari instalasi npm: setelah `pnpm install`, Plugin
bawaan dimuat dari `extensions/<id>` sehingga perubahan lokal dan dependensi
workspace lokal paket tersedia.

## Menginstal Plugin

Gunakan jalur instalasi dalam setiap entri untuk menentukan apakah instalasi diperlukan. Plugin
yang mencantumkan `included in OpenClaw` sudah tersedia dalam paket inti.
Paket eksternal resmi memerlukan satu kali instalasi, lalu Gateway harus dimulai ulang.

Sebagai contoh, Discord merupakan paket eksternal resmi:

```bash
openclaw plugins install @openclaw/discord
openclaw gateway restart
openclaw plugins inspect discord --runtime --json
```

Selama transisi peluncuran, spesifikasi paket biasa tanpa kualifikasi tetap diinstal dari npm.
Gunakan `clawhub:@openclaw/discord` atau `npm:@openclaw/discord` saat memerlukan
sumber eksplisit. Setelah instalasi, ikuti dokumentasi penyiapan Plugin, seperti
[Discord](/id/channels/discord), untuk menambahkan kredensial dan konfigurasi saluran. Lihat
[Kelola Plugin](/id/plugins/manage-plugins) untuk perintah pembaruan, penghapusan instalasi, dan
publikasi.

Setiap entri mencantumkan paket, jalur distribusi, dan deskripsi.

## Paket npm inti

69 Plugin

- **[admin-http-rpc](/id/plugins/reference/admin-http-rpc)** (`@openclaw/admin-http-rpc`) - disertakan dalam OpenClaw. Endpoint RPC HTTP admin OpenClaw.

- **[alibaba](/id/plugins/reference/alibaba)** (`@openclaw/alibaba-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia pembuatan video.

- **[anthropic](/id/plugins/reference/anthropic)** (`@openclaw/anthropic-provider`) - disertakan dalam OpenClaw. Model Anthropic, CLI Claude, dan katalog sesi Claude native.

- **[azure-speech](/id/plugins/reference/azure-speech)** (`@openclaw/azure-speech`) - disertakan dalam OpenClaw. Teks ke ucapan Azure AI Speech (MP3, pesan suara Ogg/Opus native, PCM untuk telefoni).

- **[bonjour](/id/plugins/reference/bonjour)** (`@openclaw/bonjour`) - disertakan dalam OpenClaw. Mengumumkan Gateway OpenClaw lokal melalui Bonjour/mDNS.

- **[browser](/id/plugins/reference/browser)** (`@openclaw/browser-plugin`) - disertakan dalam OpenClaw. Menambahkan alat yang dapat dipanggil agen.

- **[byteplus](/id/plugins/reference/byteplus)** (`@openclaw/byteplus-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model BytePlus dan BytePlus Plan ke OpenClaw.

- **[canvas](/id/plugins/reference/canvas)** (`@openclaw/canvas-plugin`) - disertakan dalam OpenClaw. Permukaan eksperimental untuk kontrol Canvas dan rendering A2UI bagi Node yang dipasangkan.

- **[clawrouter](/id/plugins/reference/clawrouter)** (`@openclaw/clawrouter`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model ClawRouter ke OpenClaw.

- **[cohere](/id/plugins/reference/cohere)** (`@openclaw/cohere-provider`) - disertakan dalam OpenClaw; npm; ClawHub: `clawhub:@openclaw/cohere-provider`. Plugin penyedia Cohere untuk OpenClaw.

- **[comfy](/id/plugins/reference/comfy)** (`@openclaw/comfy-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model ComfyUI ke OpenClaw.

- **[copilot-proxy](/id/plugins/reference/copilot-proxy)** (`@openclaw/copilot-proxy`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model Copilot Proxy ke OpenClaw.

- **[crabbox](/id/plugins/reference/crabbox)** (`@openclaw/crabbox-provider`) - disertakan dalam OpenClaw. Penyedia worker cloud yang didukung oleh CLI Crabbox.

- **[deepgram](/id/plugins/reference/deepgram)** (`@openclaw/deepgram-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia pemahaman media. Menambahkan dukungan penyedia transkripsi waktu nyata.

- **[document-extract](/id/plugins/reference/document-extract)** (`@openclaw/document-extract-plugin`) - disertakan dalam OpenClaw. Mengekstrak teks dan gambar halaman cadangan dari lampiran dokumen lokal.

- **[duckduckgo](/id/plugins/reference/duckduckgo)** (`@openclaw/duckduckgo-plugin`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia pencarian web.

- **[elevenlabs](/id/plugins/reference/elevenlabs)** (`@openclaw/elevenlabs-speech`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia pemahaman media. Menambahkan dukungan penyedia transkripsi waktu nyata. Menambahkan dukungan penyedia teks ke ucapan.

- **[fal](/id/plugins/reference/fal)** (`@openclaw/fal-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model fal ke OpenClaw.

- **[file-transfer](/id/plugins/reference/file-transfer)** (`@openclaw/file-transfer`) - disertakan dalam OpenClaw. Mengambil, mencantumkan, dan menulis file pada Node yang dipasangkan melalui perintah Node khusus. Menghindari pemotongan stdout bash dengan menggunakan base64 melalui node.invoke untuk berkas biner hingga 16 MB.

- **[github-copilot](/id/plugins/reference/github-copilot)** (`@openclaw/github-copilot-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model GitHub Copilot ke OpenClaw.

- **[google](/id/plugins/reference/google)** (`@openclaw/google-plugin`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model Google, CLI Google Gemini, dan Google Vertex ke OpenClaw.

- **[huggingface](/id/plugins/reference/huggingface)** (`@openclaw/huggingface-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model Hugging Face ke OpenClaw.

- **[imessage](/id/plugins/reference/imessage)** (`@openclaw/imessage`) - disertakan dalam OpenClaw. Menambahkan permukaan saluran iMessage untuk mengirim dan menerima pesan OpenClaw.

- **[linux-canvas](/id/plugins/reference/linux-canvas)** (`@openclaw/linux-canvas`) - disertakan dalam OpenClaw. Jembatan rendering Canvas untuk aplikasi desktop Linux OpenClaw.

- **[linux-node](/id/plugins/reference/linux-node)** (`@openclaw/linux-node`) - disertakan dalam OpenClaw. Notifikasi desktop, pengambilan gambar kamera, dan lokasi untuk host Node Linux.

- **[litellm](/id/plugins/reference/litellm)** (`@openclaw/litellm-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model LiteLLM ke OpenClaw.

- **[llm-task](/id/plugins/reference/llm-task)** (`@openclaw/llm-task`) - disertakan dalam OpenClaw. Alat LLM generik khusus JSON untuk tugas terstruktur yang dapat dipanggil dari alur kerja.

- **[lmstudio](/id/plugins/reference/lmstudio)** (`@openclaw/lmstudio-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model LM Studio ke OpenClaw.

- **[logbook](/id/plugins/reference/logbook)** (`@openclaw/logbook`) - disertakan dalam OpenClaw. Jurnal kerja otomatis: mengambil snapshot layar secara berkala dari Node yang dipasangkan dan mengubahnya menjadi linimasa aktivitas harian yang dapat ditinjau.

- **[memory-core](/id/plugins/reference/memory-core)** (`@openclaw/memory-core`) - disertakan dalam OpenClaw. Menambahkan alat yang dapat dipanggil agen.

- **[memory-wiki](/id/plugins/reference/memory-wiki)** (`@openclaw/memory-wiki`) - disertakan dalam OpenClaw. Kompilator wiki persisten dan brankas pengetahuan yang ramah Obsidian untuk OpenClaw.

- **[meta](/id/plugins/reference/meta)** (`@openclaw/meta-provider`) - disertakan dalam OpenClaw; npm; ClawHub: `clawhub:@openclaw/meta-provider`. Menambahkan dukungan penyedia model Meta ke OpenClaw.

- **[microsoft](/id/plugins/reference/microsoft)** (`@openclaw/microsoft-speech`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia teks ke ucapan.

- **[microsoft-foundry](/id/plugins/reference/microsoft-foundry)** (`@openclaw/microsoft-foundry`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model Microsoft Foundry ke OpenClaw.

- **[migrate-claude](/id/plugins/reference/migrate-claude)** (`@openclaw/migrate-claude`) - disertakan dalam OpenClaw. Mengimpor instruksi Claude Code dan Claude Desktop, server MCP, Skills, serta konfigurasi aman ke OpenClaw.

- **[migrate-hermes](/id/plugins/reference/migrate-hermes)** (`@openclaw/migrate-hermes`) - disertakan dalam OpenClaw. Mengimpor konfigurasi, memori, Skills, dan kredensial Hermes yang didukung ke OpenClaw.

- **[minimax](/id/plugins/reference/minimax)** (`@openclaw/minimax-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model MiniMax dan MiniMax Portal ke OpenClaw.

- **[mistral](/id/plugins/reference/mistral)** (`@openclaw/mistral-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model Mistral ke OpenClaw.

- **[novita](/id/plugins/reference/novita)** (`@openclaw/novita-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model Novita, Novita AI, dan Novitaai ke OpenClaw.

- **[nvidia](/id/plugins/reference/nvidia)** (`@openclaw/nvidia-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model NVIDIA ke OpenClaw.

- **[oc-path](/id/plugins/reference/oc-path)** (`@openclaw/oc-path`) - disertakan dalam OpenClaw. Menambahkan CLI path openclaw untuk pengalamatan file workspace oc://.

- **[ollama](/id/plugins/reference/ollama)** (`@openclaw/ollama-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model Ollama dan Ollama Cloud ke OpenClaw.

- **[onepassword](/id/plugins/reference/onepassword)** (`@openclaw/onepassword`) - disertakan dalam OpenClaw. Broker rahasia 1Password terkurasi dengan kebijakan persetujuan dan riwayat audit SQLite.

- **[open-prose](/id/plugins/reference/open-prose)** (`@openclaw/open-prose`) - disertakan dalam OpenClaw. Paket skill VM OpenProse dengan perintah garis miring /prose.

- **[openai](/id/plugins/reference/openai)** (`@openclaw/openai-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model OpenAI ke OpenClaw.

- **[opencode](/id/plugins/reference/opencode)** (`@openclaw/opencode-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model OpenCode ke OpenClaw.

- **[opencode-go](/id/plugins/reference/opencode-go)** (`@openclaw/opencode-go-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model OpenCode Go ke OpenClaw.

- **[openrouter](/id/plugins/reference/openrouter)** (`@openclaw/openrouter-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model OpenRouter ke OpenClaw.

- **[policy](/id/plugins/reference/policy)** (`@openclaw/policy`) - disertakan dalam OpenClaw. Menambahkan pemeriksaan doctor berbasis kebijakan untuk kesesuaian workspace.

- **[reef](/id/plugins/reference/reef)** (`@openclaw/reef`) - disertakan dalam OpenClaw. Saluran claw terenkripsi ujung ke ujung dengan perlindungan.

- **[runway](/id/plugins/reference/runway)** (`@openclaw/runway-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia pembuatan video.

- **[senseaudio](/id/plugins/reference/senseaudio)** (`@openclaw/senseaudio-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia pemahaman media.

- **[sglang](/id/plugins/reference/sglang)** (`@openclaw/sglang-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model SGLang ke OpenClaw.

- **[synthetic](/id/plugins/reference/synthetic)** (`@openclaw/synthetic-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model Synthetic ke OpenClaw.

- **[teams-meetings](/id/plugins/reference/teams-meetings)** (`@openclaw/teams-meetings`) - disertakan dalam OpenClaw. Bergabung ke rapat Microsoft Teams sebagai tamu melalui browser Chrome.

- **[telegram](/id/plugins/reference/telegram)** (`@openclaw/telegram`) - disertakan dalam OpenClaw. Menambahkan permukaan saluran Telegram untuk mengirim dan menerima pesan OpenClaw.

- **[together](/id/plugins/reference/together)** (`@openclaw/together-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model Together ke OpenClaw.

- **[tts-local-cli](/id/plugins/reference/tts-local-cli)** (`@openclaw/tts-local-cli`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia teks ke ucapan.

- **[vault](/id/plugins/reference/vault)** (`@openclaw/vault`) - disertakan dalam OpenClaw. Integrasi penyedia SecretRef HashiCorp Vault.

- **[vllm](/id/plugins/reference/vllm)** (`@openclaw/vllm-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model vLLM ke OpenClaw.

- **[volcengine](/id/plugins/reference/volcengine)** (`@openclaw/volcengine-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model Volcengine dan Volcengine Plan ke OpenClaw.

- **[voyage](/id/plugins/reference/voyage)** (`@openclaw/voyage-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia embedding memori.

- **[vydra](/id/plugins/reference/vydra)** (`@openclaw/vydra-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model Vydra ke OpenClaw.

- **[web-readability](/id/plugins/reference/web-readability)** (`@openclaw/web-readability-plugin`) - disertakan dalam OpenClaw. Mengekstrak konten artikel yang mudah dibaca dari respons pengambilan web HTML lokal.

- **[webhooks](/id/plugins/reference/webhooks)** (`@openclaw/webhooks`) - disertakan dalam OpenClaw. Webhook masuk terautentikasi yang menghubungkan otomatisasi eksternal dengan TaskFlow OpenClaw.

- **[workboard](/id/plugins/reference/workboard)** (`@openclaw/workboard`) - disertakan dalam OpenClaw. Papan kerja dasbor untuk masalah dan sesi yang dimiliki agen.

- **[xai](/id/plugins/reference/xai)** (`@openclaw/xai-plugin`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model xAI ke OpenClaw.

- **[xiaomi](/id/plugins/reference/xiaomi)** (`@openclaw/xiaomi-provider`) - disertakan dalam OpenClaw. Menambahkan dukungan penyedia model Xiaomi dan Xiaomi Token Plan ke OpenClaw.

- **[zoom-meetings](/plugins/reference/zoom-meetings)** (`@openclaw/zoom-meetings`) - disertakan dalam OpenClaw. Bergabung ke rapat Zoom sebagai tamu melalui browser Chrome.

## Paket eksternal resmi

72 plugin

- **[acpx](/id/plugins/reference/acpx)** (`@openclaw/acpx`) - npm; ClawHub. Backend runtime ACP OpenClaw dengan pengelolaan sesi dan transportasi yang dimiliki plugin.

- **[amazon-bedrock](/id/plugins/reference/amazon-bedrock)** (`@openclaw/amazon-bedrock-provider`) - npm; ClawHub. Plugin penyedia Amazon Bedrock untuk OpenClaw dengan dukungan penemuan model, embedding, dan pagar pengaman.

- **[amazon-bedrock-mantle](/id/plugins/reference/amazon-bedrock-mantle)** (`@openclaw/amazon-bedrock-mantle-provider`) - npm; ClawHub. Plugin penyedia Amazon Bedrock Mantle untuk OpenClaw bagi perutean model yang kompatibel dengan OpenAI.

- **[anthropic-vertex](/id/plugins/reference/anthropic-vertex)** (`@openclaw/anthropic-vertex-provider`) - npm; ClawHub. Plugin penyedia Anthropic Vertex untuk OpenClaw bagi model Claude di Google Vertex AI.

- **[arcee](/id/plugins/reference/arcee)** (`@openclaw/arcee-provider`) - npm; ClawHub: `clawhub:@openclaw/arcee-provider`. Menambahkan dukungan penyedia model Arcee ke OpenClaw.

- **[baseten](/plugins/reference/baseten)** (`@openclaw/baseten-provider`) - npm; ClawHub: `clawhub:@openclaw/baseten-provider`. Plugin penyedia Baseten untuk OpenClaw.

- **[brave](/id/plugins/reference/brave)** (`@openclaw/brave-plugin`) - npm; ClawHub. Plugin penyedia Brave Search untuk pencarian web di OpenClaw.

- **[cerebras](/id/plugins/reference/cerebras)** (`@openclaw/cerebras-provider`) - npm; ClawHub: `clawhub:@openclaw/cerebras-provider`. Menambahkan dukungan penyedia model Cerebras ke OpenClaw.

- **[chutes](/id/plugins/reference/chutes)** (`@openclaw/chutes-provider`) - npm; ClawHub: `clawhub:@openclaw/chutes-provider`. Menambahkan dukungan penyedia model Chutes ke OpenClaw.

- **[clickclack](/id/plugins/reference/clickclack)** (`@openclaw/clickclack`) - npm; ClawHub: `clawhub:@openclaw/clickclack`. Menambahkan permukaan kanal Clickclack untuk mengirim dan menerima pesan OpenClaw.

- **[cloudflare-ai-gateway](/id/plugins/reference/cloudflare-ai-gateway)** (`@openclaw/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/cloudflare-ai-gateway-provider`. Menambahkan dukungan penyedia model Cloudflare AI Gateway ke OpenClaw.

- **[codex](/id/plugins/reference/codex)** (`@openclaw/codex`) - npm; ClawHub. Harness server aplikasi Codex dan katalog sesi native.

- **[copilot](/id/plugins/reference/copilot)** (`@openclaw/copilot`) - npm; ClawHub: `clawhub:@openclaw/copilot`. Mendaftarkan runtime agen GitHub Copilot.

- **[deepinfra](/id/plugins/reference/deepinfra)** (`@openclaw/deepinfra-provider`) - npm; ClawHub: `clawhub:@openclaw/deepinfra-provider`. Menambahkan dukungan penyedia model DeepInfra ke OpenClaw.

- **[deepseek](/id/plugins/reference/deepseek)** (`@openclaw/deepseek-provider`) - npm; ClawHub: `clawhub:@openclaw/deepseek-provider`. Menambahkan dukungan penyedia model DeepSeek ke OpenClaw.

- **[diagnostics-otel](/id/plugins/reference/diagnostics-otel)** (`@openclaw/diagnostics-otel`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-otel`. Eksportir diagnostik OpenTelemetry OpenClaw untuk metrik, jejak, dan log.

- **[diagnostics-prometheus](/id/plugins/reference/diagnostics-prometheus)** (`@openclaw/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@openclaw/diagnostics-prometheus`. Eksportir diagnostik Prometheus OpenClaw untuk metrik runtime.

- **[diffs](/id/plugins/reference/diffs)** (`@openclaw/diffs`) - npm; ClawHub. Plugin penampil diff hanya-baca dan perender berkas untuk agen di OpenClaw.

- **[diffs-language-pack](/id/plugins/reference/diffs-language-pack)** (`@openclaw/diffs-language-pack`) - npm; ClawHub: `clawhub:@openclaw/diffs-language-pack`. Menambahkan penyorotan sintaks untuk bahasa di luar kumpulan bawaan penampil diff.

- **[discord](/id/plugins/reference/discord)** (`@openclaw/discord`) - npm; ClawHub. Plugin kanal Discord untuk OpenClaw bagi kanal, DM, perintah, dan peristiwa aplikasi.

- **[exa](/id/plugins/reference/exa)** (`@openclaw/exa-plugin`) - npm; ClawHub: `clawhub:@openclaw/exa-plugin`. Menambahkan dukungan penyedia pencarian web.

- **[featherless](/id/plugins/reference/featherless)** (`@openclaw/featherless-provider`) - npm; ClawHub: `clawhub:@openclaw/featherless-provider`. Plugin penyedia Featherless AI untuk OpenClaw.

- **[feishu](/id/plugins/reference/feishu)** (`@openclaw/feishu`) - npm; ClawHub. Plugin kanal Feishu/Lark untuk OpenClaw bagi obrolan dan alat tempat kerja (dikelola komunitas oleh @m1heng).

- **[firecrawl](/id/plugins/reference/firecrawl)** (`@openclaw/firecrawl-plugin`) - npm; ClawHub: `clawhub:@openclaw/firecrawl-plugin`. Menambahkan alat yang dapat dipanggil agen. Menambahkan dukungan penyedia pengambilan web. Menambahkan dukungan penyedia pencarian web.

- **[fireworks](/id/plugins/reference/fireworks)** (`@openclaw/fireworks-provider`) - npm; ClawHub: `clawhub:@openclaw/fireworks-provider`. Menambahkan dukungan penyedia model Fireworks ke OpenClaw.

- **[gmi](/id/plugins/reference/gmi)** (`@openclaw/gmi-provider`) - npm; ClawHub: `clawhub:@openclaw/gmi-provider`. Plugin penyedia GMI Cloud untuk OpenClaw.

- **[google-meet](/id/plugins/reference/google-meet)** (`@openclaw/google-meet`) - npm; ClawHub. Plugin peserta Google Meet untuk OpenClaw guna bergabung ke panggilan melalui transportasi Chrome atau Twilio.

- **[googlechat](/id/plugins/reference/googlechat)** (`@openclaw/googlechat`) - npm; ClawHub. Plugin kanal Google Chat untuk OpenClaw bagi ruang dan pesan langsung.

- **[gradium](/id/plugins/reference/gradium)** (`@openclaw/gradium-speech`) - npm; ClawHub: `clawhub:@openclaw/gradium-speech`. Menambahkan dukungan penyedia teks-ke-ucapan.

- **[groq](/id/plugins/reference/groq)** (`@openclaw/groq-provider`) - npm; ClawHub: `clawhub:@openclaw/groq-provider`. Menambahkan dukungan penyedia model Groq ke OpenClaw.

- **[inworld](/id/plugins/reference/inworld)** (`@openclaw/inworld-speech`) - npm; ClawHub: `clawhub:@openclaw/inworld-speech`. Teks-ke-ucapan streaming Inworld (MP3, OGG_OPUS, PCM telepon).

- **[irc](/id/plugins/reference/irc)** (`@openclaw/irc`) - npm; ClawHub: `clawhub:@openclaw/irc`. Menambahkan permukaan kanal IRC untuk mengirim dan menerima pesan OpenClaw.

- **[kilocode](/id/plugins/reference/kilocode)** (`@openclaw/kilocode-provider`) - npm; ClawHub: `clawhub:@openclaw/kilocode-provider`. Menambahkan dukungan penyedia model Kilocode ke OpenClaw.

- **[kimi](/id/plugins/reference/kimi)** (`@openclaw/kimi-provider`) - npm; ClawHub: `clawhub:@openclaw/kimi-provider`. Menambahkan dukungan penyedia model Kimi dan Kimi Coding ke OpenClaw.

- **[line](/id/plugins/reference/line)** (`@openclaw/line`) - npm; ClawHub. Plugin kanal LINE untuk OpenClaw bagi obrolan LINE Bot API.

- **[llama-cpp](/id/plugins/reference/llama-cpp)** (`@openclaw/llama-cpp-provider`) - npm; ClawHub. Inferensi teks dan embedding GGUF lokal melalui node-llama-cpp.

- **[lobster](/id/plugins/reference/lobster)** (`@openclaw/lobster`) - npm; ClawHub. Plugin alat alur kerja Lobster untuk pipeline bertipe dan persetujuan yang dapat dilanjutkan.

- **[longcat](/id/plugins/reference/longcat)** (`@openclaw/longcat-provider`) - npm; ClawHub: `clawhub:@openclaw/longcat-provider`. Plugin penyedia LongCat untuk OpenClaw.

- **[matrix](/id/plugins/reference/matrix)** (`@openclaw/matrix`) - ClawHub: `clawhub:@openclaw/matrix`; npm. Plugin kanal Matrix untuk OpenClaw bagi ruang dan pesan langsung.

- **[mattermost](/id/plugins/reference/mattermost)** (`@openclaw/mattermost`) - npm; ClawHub: `clawhub:@openclaw/mattermost`. Menambahkan permukaan kanal Mattermost untuk mengirim dan menerima pesan OpenClaw.

- **[memory-lancedb](/id/plugins/reference/memory-lancedb)** (`@openclaw/memory-lancedb`) - npm; ClawHub. Plugin memori jangka panjang OpenClaw berbasis LanceDB dengan pemanggilan kembali otomatis, pengambilan otomatis, dan pencarian vektor.

- **[moonshot](/id/plugins/reference/moonshot)** (`@openclaw/moonshot-provider`) - npm; ClawHub: `clawhub:@openclaw/moonshot-provider`. Menambahkan dukungan penyedia model Moonshot ke OpenClaw.

- **[msteams](/id/plugins/reference/msteams)** (`@openclaw/msteams`) - npm; ClawHub. Plugin kanal Microsoft Teams untuk OpenClaw bagi percakapan bot.

- **[mxc](/id/plugins/reference/mxc)** (`@openclaw/mxc-sandbox`) - npm; ClawHub. Eksekusi alat tersandbox pada tingkat OS melalui MXC untuk host Windows yang mendukung MXC: menjalankan perintah dalam ProcessContainer (Windows) dengan berkas kebijakan MXC yang dikonfigurasi.

- **[nextcloud-talk](/id/plugins/reference/nextcloud-talk)** (`@openclaw/nextcloud-talk`) - npm; ClawHub. Plugin kanal Nextcloud Talk untuk percakapan di OpenClaw.

- **[nostr](/id/plugins/reference/nostr)** (`@openclaw/nostr`) - npm; ClawHub. Plugin kanal Nostr untuk OpenClaw bagi pesan langsung terenkripsi NIP-04.

- **[openshell](/id/plugins/reference/openshell)** (`@openclaw/openshell-sandbox`) - npm; ClawHub. Backend sandbox OpenClaw untuk CLI NVIDIA OpenShell dengan ruang kerja lokal yang dicerminkan dan eksekusi perintah SSH.

- **[parallel](/id/tools/parallel-search)** (`@openclaw/parallel-plugin`) - npm; ClawHub: `clawhub:@openclaw/parallel-plugin`. Menambahkan dukungan penyedia pencarian web.

- **[perplexity](/id/plugins/reference/perplexity)** (`@openclaw/perplexity-plugin`) - npm; ClawHub: `clawhub:@openclaw/perplexity-plugin`. Menambahkan dukungan penyedia pencarian web.

- **[pixverse](/id/plugins/reference/pixverse)** (`@openclaw/pixverse-provider`) - npm; ClawHub: `clawhub:@openclaw/pixverse-provider`. Plugin penyedia pembuatan video PixVerse untuk OpenClaw.

- **[qianfan](/id/plugins/reference/qianfan)** (`@openclaw/qianfan-provider`) - npm; ClawHub: `clawhub:@openclaw/qianfan-provider`. Menambahkan dukungan penyedia model Qianfan ke OpenClaw.

- **[qqbot](/id/plugins/reference/qqbot)** (`@openclaw/qqbot`) - npm; ClawHub. Plugin kanal QQ Bot untuk OpenClaw bagi alur kerja grup dan pesan langsung.

- **[qwen](/id/plugins/reference/qwen)** (`@openclaw/qwen-provider`) - npm; ClawHub: `clawhub:@openclaw/qwen-provider`. Menambahkan dukungan penyedia model Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Token Plan, dan Bailian Token Plan ke OpenClaw.

- **[raft](/id/plugins/reference/raft)** (`@openclaw/raft`) - npm; ClawHub. Plugin kanal Raft untuk OpenClaw bagi jembatan pengaktifan CLI yang aman.

- **[searxng](/id/plugins/reference/searxng)** (`@openclaw/searxng-plugin`) - npm; ClawHub: `clawhub:@openclaw/searxng-plugin`. Menambahkan dukungan penyedia pencarian web.

- **[signal](/id/plugins/reference/signal)** (`@openclaw/signal`) - npm; ClawHub: `clawhub:@openclaw/signal`. Menambahkan permukaan kanal Signal untuk mengirim dan menerima pesan OpenClaw.

- **[slack](/id/plugins/reference/slack)** (`@openclaw/slack`) - npm; ClawHub. Plugin kanal Slack untuk OpenClaw bagi kanal, DM, perintah, dan peristiwa aplikasi.

- **[sms](/id/plugins/reference/sms)** (`@openclaw/sms`) - npm; ClawHub: `clawhub:@openclaw/sms`. Plugin kanal SMS Twilio untuk pesan teks OpenClaw.

- **[stepfun](/id/plugins/reference/stepfun)** (`@openclaw/stepfun-provider`) - npm; ClawHub: `clawhub:@openclaw/stepfun-provider`. Menambahkan dukungan penyedia model StepFun dan StepFun Plan ke OpenClaw.

- **[synology-chat](/id/plugins/reference/synology-chat)** (`@openclaw/synology-chat`) - npm; ClawHub. Plugin saluran Synology Chat untuk saluran dan pesan langsung OpenClaw.

- **[tavily](/id/plugins/reference/tavily)** (`@openclaw/tavily-plugin`) - npm; ClawHub: `clawhub:@openclaw/tavily-plugin`. Menambahkan alat yang dapat dipanggil agen. Menambahkan dukungan penyedia pencarian web.

- **[tencent](/id/plugins/reference/tencent)** (`@openclaw/tencent-provider`) - npm; ClawHub: `clawhub:@openclaw/tencent-provider`. Menambahkan dukungan penyedia model Tencent TokenHub dan Tencent Tokenplan ke OpenClaw.

- **[tlon](/id/plugins/reference/tlon)** (`@openclaw/tlon`) - npm; ClawHub. Plugin saluran Tlon/Urbit OpenClaw untuk alur kerja obrolan.

- **[tokenjuice](/id/plugins/reference/tokenjuice)** (`@openclaw/tokenjuice`) - npm; ClawHub: `clawhub:@openclaw/tokenjuice`. Memadatkan hasil alat exec dan bash dengan pereduksi Tokenjuice.

- **[twitch](/id/plugins/reference/twitch)** (`@openclaw/twitch`) - npm; ClawHub. Plugin saluran Twitch OpenClaw untuk alur kerja obrolan dan moderasi.

- **[venice](/id/plugins/reference/venice)** (`@openclaw/venice-provider`) - npm; ClawHub: `clawhub:@openclaw/venice-provider`. Menambahkan dukungan penyedia model Venice ke OpenClaw.

- **[vercel-ai-gateway](/id/plugins/reference/vercel-ai-gateway)** (`@openclaw/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@openclaw/vercel-ai-gateway-provider`. Menambahkan dukungan penyedia model Vercel AI Gateway ke OpenClaw.

- **[voice-call](/id/plugins/reference/voice-call)** (`@openclaw/voice-call`) - npm; ClawHub. Plugin panggilan suara OpenClaw untuk panggilan telepon Twilio, Telnyx, dan Plivo.

- **[whatsapp](/id/plugins/reference/whatsapp)** (`@openclaw/whatsapp`) - ClawHub: `clawhub:@openclaw/whatsapp`; npm. Plugin saluran WhatsApp OpenClaw untuk obrolan WhatsApp Web.

- **[zai](/id/plugins/reference/zai)** (`@openclaw/zai-provider`) - npm; ClawHub: `clawhub:@openclaw/zai-provider`. Menambahkan dukungan penyedia model Z.AI ke OpenClaw.

- **[zalo](/id/plugins/reference/zalo)** (`@openclaw/zalo`) - npm; ClawHub. Plugin saluran Zalo OpenClaw untuk obrolan bot dan webhook.

- **[zalouser](/id/plugins/reference/zalouser)** (`@openclaw/zalouser`) - npm; ClawHub. Plugin Akun Pribadi Zalo OpenClaw melalui integrasi zca-js native.

## Hanya checkout sumber

2 plugin

- **[qa-channel](/id/plugins/reference/qa-channel)** (`@openclaw/qa-channel`) - hanya checkout sumber. Menambahkan permukaan QA Channel untuk mengirim dan menerima pesan OpenClaw.

- **[qa-lab](/id/plugins/reference/qa-lab)** (`@openclaw/qa-lab`) - hanya checkout sumber. Plugin lab QA OpenClaw dengan antarmuka pengguna debugger privat dan pelaksana skenario.
