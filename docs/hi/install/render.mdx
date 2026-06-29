---
read_when:
    - OpenClaw को Render पर डिप्लॉय करना
    - आप Render Blueprints के साथ एक घोषणात्मक क्लाउड डिप्लॉय चाहते हैं
summary: Infrastructure-as-Code के साथ Render पर OpenClaw डिप्लॉय करें
title: रेंडर
x-i18n:
    generated_at: "2026-06-28T23:23:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 16
---

# Render

Infrastructure as Code का उपयोग करके OpenClaw को Render पर डिप्लॉय करें। शामिल `render.yaml` Blueprint आपकी पूरी stack को declaratively परिभाषित करता है, service, disk, environment variables, ताकि आप एक क्लिक में डिप्लॉय कर सकें और अपने infrastructure को अपने code के साथ version कर सकें।

## पूर्वापेक्षाएँ

- एक [Render खाता](https://render.com) (free tier उपलब्ध)
- आपके पसंदीदा [model provider](/hi/providers) से एक API key

## Render Blueprint के साथ डिप्लॉय करें

[Render पर डिप्लॉय करें](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

इस लिंक पर क्लिक करने से:

1. इस repo के root में मौजूद `render.yaml` Blueprint से एक नई Render service बनेगी।
2. Docker image build होगी और डिप्लॉय होगी

डिप्लॉय होने के बाद, आपके service URL का pattern `https://<service-name>.onrender.com` होता है।

## Blueprint को समझना

Render Blueprints YAML files हैं जो आपके infrastructure को परिभाषित करती हैं। इस
repository में मौजूद `render.yaml` OpenClaw चलाने के लिए आवश्यक सब कुछ configure करता है:

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # auto-generates a secure token
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

उपयोग की गई मुख्य Blueprint विशेषताएँ:

| विशेषता              | उद्देश्य                                                   |
| -------------------- | ---------------------------------------------------------- |
| `runtime: docker`    | repo के Dockerfile से build करता है                        |
| `healthCheckPath`    | Render `/health` को monitor करता है और अस्वस्थ instances को restart करता है |
| `generateValue: true` | Cryptographically secure value अपने-आप generate करता है   |
| `disk`               | Persistent storage जो redeploys के बाद भी बना रहता है      |

## Plan चुनना

| Plan      | Spin-down         | Disk          | किसके लिए सबसे अच्छा           |
| --------- | ----------------- | ------------- | ------------------------------- |
| Free      | 15 min idle के बाद | उपलब्ध नहीं   | Testing, demos                  |
| Starter   | कभी नहीं          | 1GB+          | Personal use, छोटी teams        |
| Standard+ | कभी नहीं          | 1GB+          | Production, कई channels         |

Blueprint default रूप से `starter` का उपयोग करता है। Free tier का उपयोग करने के लिए,
अपने fork के `render.yaml` में `plan: free` बदलें (लेकिन ध्यान दें: persistent disk न होने का मतलब है कि OpenClaw state
हर deploy पर reset हो जाती है)।

## Deployment के बाद

### Control UI तक पहुँचें

Web dashboard `https://<your-service>.onrender.com/` पर उपलब्ध है।

Configured shared secret का उपयोग करके connect करें। यह deploy template
`OPENCLAW_GATEWAY_TOKEN` अपने-आप generate करता है (इसे **Dashboard → your service →
Environment** में ढूँढें); अगर आप इसे password auth से replace करते हैं, तो उसके बजाय वही password उपयोग करें।

## Render Dashboard की विशेषताएँ

### Logs

**Dashboard → your service → Logs** में real-time logs देखें। इनके अनुसार filter करें:

- Build logs (Docker image creation)
- Deploy logs (service startup)
- Runtime logs (application output)

### Shell access

Debugging के लिए, **Dashboard → your service → Shell** के माध्यम से shell session खोलें। Persistent disk `/data` पर mounted है।

### Environment variables

**Dashboard → your service → Environment** में variables modify करें। Changes automatic redeploy trigger करते हैं।

### Auto-deploy

अगर आप मूल OpenClaw repository का उपयोग करते हैं, तो Render आपके OpenClaw को auto-deploy नहीं करेगा। इसे update करने के लिए, dashboard से manual Blueprint sync चलाएँ।

## Custom domain

1. **Dashboard → your service → Settings → Custom Domains** पर जाएँ
2. अपना domain add करें
3. निर्देशों के अनुसार DNS configure करें (`*.onrender.com` पर CNAME)
4. Render अपने-आप TLS certificate provision करता है

## Scaling

Render horizontal और vertical scaling support करता है:

- **Vertical**: अधिक CPU/RAM पाने के लिए plan बदलें
- **Horizontal**: Instance count बढ़ाएँ (Standard plan और उससे ऊपर)

OpenClaw के लिए, vertical scaling आमतौर पर पर्याप्त होती है। Horizontal scaling के लिए sticky sessions या external state management की आवश्यकता होती है।

## Backups और migration

Render Dashboard में shell access का उपयोग करके किसी भी समय अपनी state, config, auth profiles, और workspace export करें:

```bash
openclaw backup create
```

यह OpenClaw state और किसी भी configured workspace के साथ एक portable backup archive बनाता है। विवरण के लिए [Backup](/hi/cli/backup) देखें।

## Troubleshooting

### Service start नहीं होगी

Render Dashboard में deploy logs देखें। सामान्य issues:

- `OPENCLAW_GATEWAY_TOKEN` missing — verify करें कि यह **Dashboard → Environment** में set है
- Port mismatch — सुनिश्चित करें कि `OPENCLAW_GATEWAY_PORT=8080` set है ताकि gateway उस port से bind हो जिसकी Render अपेक्षा करता है

### Slow cold starts (free tier)

Free tier services 15 minutes की inactivity के बाद spin down हो जाती हैं। Spin-down के बाद पहली request में container start होने के दौरान कुछ seconds लगते हैं। Always-on के लिए Starter plan में upgrade करें।

### Redeploy के बाद data loss

यह free tier पर होता है (persistent disk नहीं)। Paid plan में upgrade करें, या
Render shell में `openclaw backup create` के माध्यम से नियमित रूप से full backup export करें।

### Health check failures

Render `/health` से 30 seconds के भीतर 200 response की अपेक्षा करता है। अगर builds सफल होते हैं लेकिन deploys fail होते हैं, तो service start होने में बहुत अधिक समय ले रही हो सकती है। जाँचें:

- Errors के लिए build logs
- क्या container `docker build && docker run` के साथ locally चलता है

## अगले steps

- Messaging channels set up करें: [Channels](/hi/channels)
- Gateway configure करें: [Gateway configuration](/hi/gateway/configuration)
- OpenClaw को up to date रखें: [Updating](/hi/install/updating)
