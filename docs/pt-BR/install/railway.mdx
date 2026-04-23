---
read_when:
    - Implantando o OpenClaw no Railway
    - Você quer uma implantação em nuvem com um clique e UI de controle no navegador
summary: Implantar o OpenClaw no Railway com template de um clique
title: Railway
x-i18n:
    generated_at: "2026-04-23T14:04:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 989c8467ead04b8aa7c94101abd99c936ecd3e451fe728afe8c2f2bd5a78df48
    source_path: install/railway.mdx
    workflow: 15
---

# Railway

Implante o OpenClaw no Railway com um template de um clique e acesse-o pela UI de controle web.
Este é o caminho mais fácil de “sem terminal no servidor”: o Railway executa o Gateway para você.

## Checklist rápido (novos usuários)

1. Clique em **Deploy on Railway** (abaixo).
2. Adicione um **Volume** montado em `/data`.
3. Defina as **Variables** obrigatórias (pelo menos `OPENCLAW_GATEWAY_PORT` e `OPENCLAW_GATEWAY_TOKEN`).
4. Habilite **HTTP Proxy** na porta `8080`.
5. Abra `https://<your-railway-domain>/openclaw` e conecte-se usando o segredo compartilhado configurado. Este template usa `OPENCLAW_GATEWAY_TOKEN` por padrão; se você substituí-lo por autenticação por senha, use essa senha.

## Implantação com um clique

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Deploy on Railway
</a>

Após a implantação, encontre sua URL pública em **Railway → seu serviço → Settings → Domains**.

O Railway irá:

- fornecer um domínio gerado (geralmente `https://<something>.up.railway.app`), ou
- usar seu domínio personalizado, se você tiver conectado um.

Depois, abra:

- `https://<your-railway-domain>/openclaw` — UI de controle

## O que você recebe

- Gateway + UI de controle do OpenClaw hospedados
- Armazenamento persistente via Volume do Railway (`/data`) para que `openclaw.json`,
  `auth-profiles.json` por agent, estado de canal/provedor, sessões e
  espaço de trabalho sobrevivam a reimplantações

## Configurações obrigatórias do Railway

### Rede pública

Habilite **HTTP Proxy** para o serviço.

- Porta: `8080`

### Volume (obrigatório)

Anexe um volume montado em:

- `/data`

### Variables

Defina estas variáveis no serviço:

- `OPENCLAW_GATEWAY_PORT=8080` (obrigatório — deve corresponder à porta em Rede pública)
- `OPENCLAW_GATEWAY_TOKEN` (obrigatório; trate como um segredo de administrador)
- `OPENCLAW_STATE_DIR=/data/.openclaw` (recomendado)
- `OPENCLAW_WORKSPACE_DIR=/data/workspace` (recomendado)

## Conectar um canal

Use a UI de controle em `/openclaw` ou execute `openclaw onboard` pelo shell do Railway para instruções de configuração de canal:

- [Telegram](/pt-BR/channels/telegram) (mais rápido — apenas um token de bot)
- [Discord](/pt-BR/channels/discord)
- [Todos os canais](/pt-BR/channels)

## Backups e migração

Exporte seu estado, configuração, perfis de autenticação e espaço de trabalho:

```bash
openclaw backup create
```

Isso cria um arquivo portátil de backup com o estado do OpenClaw, além de qualquer
espaço de trabalho configurado. Consulte [Backup](/pt-BR/cli/backup) para detalhes.

## Próximos passos

- Configure canais de mensagens: [Canais](/pt-BR/channels)
- Configure o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Mantenha o OpenClaw atualizado: [Atualizando](/pt-BR/install/updating)
