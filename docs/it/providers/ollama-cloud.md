---
read_when:
    - Vuoi usare modelli Ollama in hosting senza un server Ollama locale
    - Ti serve l'id, la chiave o l'endpoint del provider ollama-cloud
summary: Usa Ollama Cloud direttamente con OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-06-27T18:08:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 24b937085de1ed805b7bb0fe76a4197030bd45cd989ede8030386f3c721b9763
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud è l'API di modelli ospitata di Ollama. Permette a OpenClaw di chiamare direttamente i modelli ospitati da Ollama, senza installare un server Ollama locale o autenticare un'app Ollama locale in modalità cloud. Usa l'id provider `ollama-cloud` e riferimenti modello come `ollama-cloud/kimi-k2.6`.

Questa pagina riguarda l'instradamento diretto solo cloud. Il provider usa lo stile nativo `/api/chat` di Ollama, non la route compatibile con OpenAI `/v1`. OpenClaw lo registra come id provider separato, così le credenziali solo cloud, la scoperta del catalogo live e la selezione del modello non vengono mescolate con un host `ollama` locale.

Usa questa pagina quando vuoi un instradamento solo cloud. Per Ollama locale, instradamento ibrido cloud più locale, embeddings e dettagli di host personalizzati, vedi [Ollama](/it/providers/ollama).

## Configurazione

Crea una chiave API di Ollama Cloud su [ollama.com/settings/keys](https://ollama.com/settings/keys), quindi esegui:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Oppure imposta:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

## Valori predefiniti

- Provider: `ollama-cloud`
- URL base: `https://ollama.com`
- Variabile di ambiente: `OLLAMA_API_KEY`
- Stile API: `/api/chat` nativo di Ollama
- Modello di esempio: `ollama-cloud/kimi-k2.6`

## Quando scegliere Ollama Cloud

- Vuoi modelli Ollama ospitati senza eseguire `ollama serve` in locale.
- Vuoi la stessa forma dell'API chat nativa di Ollama che OpenClaw usa per Ollama locale, ma puntata a `https://ollama.com`.
- Vuoi un percorso cloud semplice per modelli che sono già nel catalogo ospitato di Ollama.
- Non ti servono pull di modelli locali, controllo GPU locale o inferenza solo LAN.

Usa invece [Ollama](/it/providers/ollama) quando vuoi un instradamento solo locale o cloud più locale tramite un host Ollama autenticato. Usa invece un provider compatibile con OpenAI quando ti servono semantiche `/v1/chat/completions` o funzionalità in stile OpenAI specifiche del provider.

## Modelli

OpenClaw scopre i modelli Ollama Cloud dal catalogo ospitato live. Gli id ospitati comunemente disponibili includono:

- `ollama-cloud/gpt-oss:20b`
- `ollama-cloud/kimi-k2.6`
- `ollama-cloud/deepseek-v4-flash`
- `ollama-cloud/minimax-m2.7`
- `ollama-cloud/glm-5`

Usa un id modello dal tuo catalogo ospitato corrente:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Gli id modello sono id del catalogo cloud, non nomi di pull locali. Se un nome modello funziona in un host Ollama locale ma è assente dal catalogo ospitato, usa invece il provider `ollama` con quell'host locale.

## Test live

Per smoke test con chiave API di Ollama Cloud, punta il test live di Ollama all'endpoint ospitato e scegli un modello dal tuo catalogo corrente:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=1 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Lo smoke cloud esegue testo, stream nativo e ricerca web. Salta gli embeddings per impostazione predefinita per `https://ollama.com` perché le chiavi API di Ollama Cloud potrebbero non autorizzare `/api/embed`.

## Risoluzione dei problemi

- Errori `Set OLLAMA_API_KEY`: fornisci una vera chiave API cloud. Il marker locale `ollama-local` è solo per host Ollama locali o privati.
- Errori di modello sconosciuto: esegui `openclaw models list --provider ollama-cloud` e copia esattamente l'id modello ospitato.
- Problemi di chiamata strumenti o JSON grezzo su host Ollama personalizzati: controlla se stai usando accidentalmente un URL `/v1` compatibile con OpenAI. Le route Ollama dovrebbero usare l'URL base nativo senza suffisso `/v1`.

## Correlati

- [Ollama](/it/providers/ollama)
- [Provider di modelli](/it/concepts/model-providers)
- [Tutti i provider](/it/providers/index)
