---
read_when:
    - Implantação do OpenClaw no Railway
    - Você quer uma implantação na nuvem com um clique e uma interface de controle baseada no navegador
summary: Implante o OpenClaw no Railway com um modelo de um clique
title: Railway
x-i18n:
    generated_at: "2026-07-12T00:05:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbef00b8de61545e9971b18164472c2f47fe607f69ec36f83a27a11b65ea863f
    source_path: install/railway.mdx
    workflow: 16
---

Implante o OpenClaw na Railway com um modelo de um clique e acesse-o pela interface web de controle. Este é o caminho mais fácil, “sem terminal no servidor”: a Railway executa o Gateway para você.

## Implantação com um clique

<a href="https://railway.com/deploy/clawdbot-railway-template" target="_blank" rel="noreferrer">
  Deploy on Railway
</a>

<Steps>
  <Step title="Implante o modelo">
    Clique em **Deploy on Railway** acima.
  </Step>

<Step title="Adicione um volume">
  Anexe um volume montado em `/data` (obrigatório para a persistência do estado).
</Step>

  <Step title="Defina as variáveis">
    Defina as **Variables** obrigatórias no serviço:

    - `OPENCLAW_GATEWAY_PORT=8080` (obrigatória -- deve corresponder à porta em Public Networking)
    - `OPENCLAW_GATEWAY_TOKEN` (obrigatória; trate-a como um segredo de administrador)
    - `OPENCLAW_STATE_DIR=/data/.openclaw` (recomendada)
    - `OPENCLAW_WORKSPACE_DIR=/data/workspace` (recomendada)

  </Step>

<Step title="Ative a rede pública">
  Em **Public Networking**, ative **HTTP Proxy** para o serviço na porta `8080`.
</Step>

  <Step title="Conecte-se">
    Encontre sua URL pública em **Railway -> your service -> Settings -> Domains** -- seja um domínio gerado (geralmente `https://<something>.up.railway.app`) ou o domínio personalizado que você vinculou.

    Abra `https://<your-railway-domain>/openclaw` e conecte-se usando o segredo compartilhado configurado. Por padrão, o modelo usa `OPENCLAW_GATEWAY_TOKEN`; se você substituí-lo pela autenticação por senha, use essa senha.

  </Step>
</Steps>

## O que você obtém

- Gateway do OpenClaw hospedado + interface de controle
- Armazenamento persistente por meio do volume da Railway (`/data`), para que `openclaw.json`, os arquivos `auth-profiles.json` de cada agente, o estado dos canais e provedores, as sessões e o espaço de trabalho sobrevivam às reimplantações

## Conecte um canal

Use a interface de controle em `/openclaw` ou execute `openclaw onboard` pelo shell da Railway para obter instruções de configuração de canais:

- [Discord](/pt-BR/channels/discord)
- [Telegram](/pt-BR/channels/telegram) (mais rápido -- basta um token de bot)
- [Todos os canais](/pt-BR/channels)

## Backups e migração

Exporte seu estado, configuração, perfis de autenticação e espaço de trabalho:

```bash
openclaw backup create
```

Isso cria um arquivo de backup portátil com o estado do OpenClaw e qualquer espaço de trabalho configurado. Consulte [Backup](/pt-BR/cli/backup) para obter detalhes.

## Próximas etapas

- Configure canais de mensagens: [Canais](/pt-BR/channels)
- Configure o Gateway: [Configuração do Gateway](/pt-BR/gateway/configuration)
- Mantenha o OpenClaw atualizado: [Atualização](/pt-BR/install/updating)
