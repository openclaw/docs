---
read_when:
    - Configurando o Synology Chat com o OpenClaw
    - Depuração do roteamento de Webhook do Synology Chat
summary: Configuração do Webhook do Synology Chat e da configuração do OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-05-02T05:41:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
    postprocess_version: locale-links-v1
---

Status: canal de mensagem direta do Plugin incluído usando webhooks do Synology Chat.
O Plugin aceita mensagens recebidas de webhooks de saída do Synology Chat e envia respostas
por meio de um webhook de entrada do Synology Chat.

## Plugin incluído

O Synology Chat é distribuído como um Plugin incluído nas versões atuais do OpenClaw, então builds
empacotados normais não precisam de uma instalação separada.

Se você estiver em um build mais antigo ou em uma instalação personalizada que exclui o Synology Chat,
instale-o manualmente:

Instalar a partir de um checkout local:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

1. Garanta que o Plugin do Synology Chat esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente a partir de um checkout do código-fonte com o comando acima.
   - `openclaw onboard` agora mostra o Synology Chat na mesma lista de configuração de canais que `openclaw channels add`.
   - Configuração não interativa: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Nas integrações do Synology Chat:
   - Crie um webhook de entrada e copie a URL dele.
   - Crie um webhook de saída com seu token secreto.
3. Aponte a URL do webhook de saída para o Gateway do OpenClaw:
   - `https://gateway-host/webhook/synology` por padrão.
   - Ou seu `channels.synology-chat.webhookPath` personalizado.
4. Conclua a configuração no OpenClaw.
   - Guiada: `openclaw onboard`
   - Direta: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Reinicie o Gateway e envie uma DM para o bot do Synology Chat.

Detalhes de autenticação do Webhook:

- O OpenClaw aceita o token do webhook de saída de `body.token`, depois
  `?token=...`, depois cabeçalhos.
- Formas de cabeçalho aceitas:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Tokens vazios ou ausentes falham de forma fechada.

Configuração mínima:

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## Variáveis de ambiente

Para a conta padrão, você pode usar variáveis de ambiente:

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS` (separados por vírgula)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Valores de configuração substituem variáveis de ambiente.

`SYNOLOGY_CHAT_INCOMING_URL` não pode ser definido a partir de um `.env` do workspace; consulte [Arquivos `.env` do workspace](/pt-BR/gateway/security).

## Política de DM e controle de acesso

- `dmPolicy: "allowlist"` é o padrão recomendado.
- `allowedUserIds` aceita uma lista (ou string separada por vírgulas) de IDs de usuário do Synology.
- No modo `allowlist`, uma lista `allowedUserIds` vazia é tratada como configuração incorreta e a rota do webhook não será iniciada (use `dmPolicy: "open"` com `allowedUserIds: ["*"]` para permitir todos).
- `dmPolicy: "open"` permite DMs públicas somente quando `allowedUserIds` inclui `"*"`; com entradas restritivas, somente usuários correspondentes podem conversar.
- `dmPolicy: "disabled"` bloqueia DMs.
- A associação do destinatário da resposta permanece no `user_id` numérico estável por padrão. `channels.synology-chat.dangerouslyAllowNameMatching: true` é um modo de compatibilidade de emergência que reativa a busca por nome de usuário/apelido mutável para entrega de respostas.
- Aprovações de pareamento funcionam com:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Entrega de saída

Use IDs numéricos de usuário do Synology Chat como destinos.

Exemplos:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

Envios de mídia são compatíveis por meio de entrega de arquivos baseada em URL.
URLs de arquivo de saída devem usar `http` ou `https`, e destinos de rede privados ou bloqueados de outra forma são rejeitados antes que o OpenClaw encaminhe a URL para o webhook do NAS.

## Várias contas

Várias contas do Synology Chat são compatíveis em `channels.synology-chat.accounts`.
Cada conta pode substituir token, URL de entrada, caminho do webhook, política de DM e limites.
Sessões de mensagem direta são isoladas por conta e usuário, então o mesmo `user_id` numérico
em duas contas Synology diferentes não compartilha o estado da transcrição.
Dê a cada conta habilitada um `webhookPath` distinto. O OpenClaw agora rejeita caminhos exatos duplicados
e se recusa a iniciar contas nomeadas que apenas herdam um caminho de webhook compartilhado em configurações com várias contas.
Se você precisar intencionalmente de herança legada para uma conta nomeada, defina
`dangerouslyAllowInheritedWebhookPath: true` nessa conta ou em `channels.synology-chat`,
mas caminhos exatos duplicados ainda são rejeitados com falha fechada. Prefira caminhos explícitos por conta.

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## Observações de segurança

- Mantenha `token` em segredo e rotacione-o se ele vazar.
- Mantenha `allowInsecureSsl: false`, a menos que você confie explicitamente em um certificado NAS local autoassinado.
- Requisições de webhook de entrada são verificadas por token e têm limite de taxa por remetente.
- Verificações de token inválido usam comparação de segredo em tempo constante e falham de forma fechada.
- Prefira `dmPolicy: "allowlist"` para produção.
- Mantenha `dangerouslyAllowNameMatching` desativado, a menos que você precise explicitamente da entrega de respostas legada baseada em nome de usuário.
- Mantenha `dangerouslyAllowInheritedWebhookPath` desativado, a menos que você aceite explicitamente o risco de roteamento por caminho compartilhado em uma configuração com várias contas.

## Solução de problemas

- `Missing required fields (token, user_id, text)`:
  - a carga útil do webhook de saída está sem um dos campos obrigatórios
  - se o Synology enviar o token em cabeçalhos, verifique se o Gateway/proxy preserva esses cabeçalhos
- `Invalid token`:
  - o segredo do webhook de saída não corresponde a `channels.synology-chat.token`
  - a requisição está chegando à conta/caminho de webhook errado
  - um proxy reverso removeu o cabeçalho do token antes que a requisição chegasse ao OpenClaw
- `Rate limit exceeded`:
  - tentativas demais de token inválido da mesma origem podem bloquear temporariamente essa origem
  - remetentes autenticados também têm um limite separado de taxa de mensagens por usuário
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` está habilitado, mas nenhum usuário está configurado
- `User not authorized`:
  - o `user_id` numérico do remetente não está em `allowedUserIds`

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e hardening
