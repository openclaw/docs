---
read_when:
    - Vuoi utilizzare modelli Ollama in hosting senza un server Ollama locale
    - Hai bisogno dell'ID, della chiave o dell'endpoint del provider ollama-cloud
summary: Usa Ollama Cloud direttamente con OpenClaw
title: Ollama Cloud
x-i18n:
    generated_at: "2026-07-12T07:28:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 966e5237e37134cef109979079db390e9844714001e921e7976dc8ca7f58bcc4
    source_path: providers/ollama-cloud.md
    workflow: 16
---

Ollama Cloud è l'API per modelli in hosting di Ollama. Il provider `ollama-cloud` la chiama
direttamente all'indirizzo `https://ollama.com` tramite l'API nativa `/api/chat` di Ollama, senza
un server Ollama locale e senza un'app Ollama locale connessa in modalità cloud. Usa riferimenti
ai modelli come `ollama-cloud/kimi-k2.6`.

OpenClaw registra `ollama-cloud` come ID provider autonomo, affinché le
credenziali esclusivamente cloud, il rilevamento in tempo reale del catalogo e la selezione dei modelli non vengano mescolati con
un host `ollama` locale. Per Ollama locale, l'instradamento ibrido cloud e locale,
gli embedding e i dettagli degli host personalizzati, consulta [Ollama](/it/providers/ollama).

## Configurazione

Crea una chiave API di Ollama Cloud su [ollama.com/settings/keys](https://ollama.com/settings/keys), quindi esegui:

```bash
openclaw onboard --auth-choice ollama-cloud
```

Oppure imposta:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret
```

L'onboarding non interattivo accetta direttamente la chiave:

```bash
openclaw onboard --auth-choice ollama-cloud --ollama-cloud-api-key "<key>"
```

L'onboarding imposta come modello predefinito `ollama-cloud/kimi-k2.5:cloud`.

## Valori predefiniti

- Provider: `ollama-cloud`
- URL di base: `https://ollama.com`
- Variabile d'ambiente: `OLLAMA_API_KEY`
- Stile API: `/api/chat` nativa di Ollama
- Modello predefinito dell'onboarding: `ollama-cloud/kimi-k2.5:cloud`

## Quando scegliere Ollama Cloud

- Vuoi modelli Ollama in hosting senza eseguire `ollama serve` localmente.
- Vuoi la stessa struttura dell'API di chat nativa di Ollama usata da OpenClaw per Ollama
  locale, ma indirizzata a `https://ollama.com`.
- Vuoi un percorso cloud semplice per i modelli già presenti nel catalogo in hosting
  di Ollama.
- Non hai bisogno di scaricare modelli localmente, controllare GPU locali o eseguire inferenza esclusivamente sulla LAN.

Usa invece [Ollama](/it/providers/ollama) quando desideri un instradamento esclusivamente locale o
ibrido cloud e locale tramite un host Ollama connesso. Usa invece un
provider compatibile con OpenAI quando ti occorre la semantica di `/v1/chat/completions`
o funzionalità specifiche del provider in stile OpenAI.

## Modelli

Il provider richiede una chiave API; senza una chiave rimane inattivo. Con una chiave,
OpenClaw rileva in tempo reale i modelli Ollama Cloud dal catalogo in hosting:

```bash
openclaw models list --provider ollama-cloud
openclaw models set ollama-cloud/kimi-k2.6
```

Gli ID in hosting presenti nel catalogo in tempo reale includono `deepseek-v4-flash`, `glm-5`,
`gpt-oss:20b`, `kimi-k2.6` e `minimax-m2.7`. Quando il rilevamento in tempo reale non restituisce
nulla, OpenClaw ricorre alle voci incluse `kimi-k2.5:cloud`,
`minimax-m2.7:cloud`, `glm-5.1:cloud` e `glm-5.2:cloud`.

Gli ID dei modelli sono ID del catalogo cloud, non nomi per il download locale. Se il nome di un modello funziona in
un host Ollama locale ma non è presente nel catalogo in hosting, usa invece il provider `ollama`
con tale host locale.

## Test in tempo reale

Per i test di controllo con chiave API di Ollama Cloud, indirizza il test in tempo reale di Ollama all'endpoint
in hosting e scegli un modello dal tuo catalogo attuale:

```bash
export OLLAMA_API_KEY="<your-ollama-cloud-api-key>" # pragma: allowlist secret

OPENCLAW_LIVE_TEST=1 \
OPENCLAW_LIVE_OLLAMA=1 \
OPENCLAW_LIVE_OLLAMA_BASE_URL=https://ollama.com \
OPENCLAW_LIVE_OLLAMA_MODEL=kimi-k2.6 \
pnpm test:live -- extensions/ollama/ollama.live.test.ts
```

Il controllo cloud esegue testo, streaming nativo e ricerca web; imposta
`OPENCLAW_LIVE_OLLAMA_WEB_SEARCH=0` per saltare la ricerca web. Per impostazione predefinita salta gli embedding
per `https://ollama.com`, perché le chiavi API di Ollama Cloud potrebbero non
autorizzare `/api/embed`; forzali con `OPENCLAW_LIVE_OLLAMA_EMBEDDINGS=1`.

## Risoluzione dei problemi

- Errori `Ollama Cloud requires an API key` / `Set OLLAMA_API_KEY`: fornisci una
  vera chiave API cloud. Il marcatore locale `ollama-local` serve solo per host Ollama
  locali o privati.
- Errori di modello sconosciuto: esegui `openclaw models list --provider ollama-cloud` e
  copia esattamente l'ID del modello in hosting.
- Problemi con le chiamate agli strumenti o con JSON non elaborato su host Ollama personalizzati: verifica di non stare
  usando accidentalmente un URL `/v1` compatibile con OpenAI. Le route Ollama devono usare
  l'URL di base nativo senza il suffisso `/v1`.

## Risorse correlate

- [Ollama](/it/providers/ollama)
- [Provider di modelli](/it/concepts/model-providers)
- [Tutti i provider](/it/providers/index)
