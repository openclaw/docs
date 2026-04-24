---
read_when:
    - Configurando o Synology Chat com o OpenClaw
    - Depurando o roteamento de Webhook do Synology Chat
summary: Configuração do Webhook do Synology Chat e do OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-04-24T05:42:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5135e9aa1fd86437a635378dfbbde321bbd2e5f6fef7a3cc740ea54ebf4b76d5
    source_path: channels/synology-chat.md
    workflow: 15
---

Status: Plugin integrado de canal de mensagem direta usando webhooks do Synology Chat.
O Plugin aceita mensagens de entrada de webhooks de saída do Synology Chat e envia respostas
por meio de um webhook de entrada do Synology Chat.

## Plugin integrado

O Synology Chat é fornecido como um Plugin integrado nas versões atuais do OpenClaw, então compilações
empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o Synology Chat,
instale-o manualmente:

Instale a partir de um checkout local:

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

1. Verifique se o Plugin do Synology Chat está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente a partir de um checkout do código-fonte com o comando acima.
   - `openclaw onboard` agora mostra o Synology Chat na mesma lista de configuração de canais que `openclaw channels add`.
   - Configuração não interativa: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. Nas integrações do Synology Chat:
   - Crie um webhook de entrada e copie a URL dele.
   - Crie um webhook de saída com seu token secreto.
3. Aponte a URL do webhook de saída para o seu gateway OpenClaw:
   - `https://gateway-host/webhook/synology` por padrão.
   - Ou seu `channels.synology-chat.webhookPath` personalizado.
4. Conclua a configuração no OpenClaw.
   - Guiada: `openclaw onboard`
   - Direta: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Reinicie o gateway e envie uma DM para o bot do Synology Chat.

Detalhes da autenticação do webhook:

- O OpenClaw aceita o token do webhook de saída de `body.token`, depois
  `?token=...` e depois cabeçalhos.
- Formatos de cabeçalho aceitos:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Tokens vazios ou ausentes falham em modo fechado.

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

Os valores da configuração substituem as variáveis de ambiente.

`SYNOLOGY_CHAT_INCOMING_URL` não pode ser definido a partir de um `.env` do workspace; consulte [Arquivos `.env` do workspace](/pt-BR/gateway/security).

## Política de DM e controle de acesso

- `dmPolicy: "allowlist"` é o padrão recomendado.
- `allowedUserIds` aceita uma lista (ou string separada por vírgulas) de IDs de usuário do Synology.
- No modo `allowlist`, uma lista vazia de `allowedUserIds` é tratada como configuração incorreta e a rota do webhook não será iniciada (use `dmPolicy: "open"` para permitir todos).
- `dmPolicy: "open"` permite qualquer remetente.
- `dmPolicy: "disabled"` bloqueia DMs.
- O vínculo do destinatário da resposta permanece no `user_id` numérico estável por padrão. `channels.synology-chat.dangerouslyAllowNameMatching: true` é um modo de compatibilidade de emergência que reativa a busca por nome de usuário/apelido mutável para entrega de respostas.
- As aprovações de pareamento funcionam com:
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## Entrega de saída

Use IDs numéricos de usuário do Synology Chat como destinos.

Exemplos:

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

Envios de mídia são compatíveis por entrega de arquivo baseada em URL.
URLs de arquivo de saída devem usar `http` ou `https`, e alvos de rede privados ou bloqueados de outra forma são rejeitados antes que o OpenClaw encaminhe a URL para o webhook do NAS.

## Várias contas

Várias contas do Synology Chat são compatíveis em `channels.synology-chat.accounts`.
Cada conta pode substituir token, URL de entrada, caminho do webhook, política de DM e limites.
Sessões de mensagem direta são isoladas por conta e usuário, então o mesmo `user_id` numérico
em duas contas diferentes do Synology não compartilha o estado da transcrição.
Dê a cada conta habilitada um `webhookPath` distinto. O OpenClaw agora rejeita caminhos exatos duplicados
e se recusa a iniciar contas nomeadas que apenas herdam um caminho de webhook compartilhado em configurações com várias contas.
Se você intencionalmente precisar de herança legada para uma conta nomeada, defina
`dangerouslyAllowInheritedWebhookPath: true` nessa conta ou em `channels.synology-chat`,
mas caminhos exatos duplicados ainda são rejeitados em modo fechado. Prefira caminhos explícitos por conta.

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

- Mantenha `token` em segredo e faça a rotação se ele vazar.
- Mantenha `allowInsecureSsl: false` a menos que você confie explicitamente em um certificado local autoassinado do NAS.
- Solicitações de webhook de entrada são verificadas por token e limitadas por taxa por remetente.
- Verificações de token inválido usam comparação de segredo em tempo constante e falham em modo fechado.
- Prefira `dmPolicy: "allowlist"` em produção.
- Mantenha `dangerouslyAllowNameMatching` desativado, a menos que você precise explicitamente da entrega legada de respostas baseada em nome de usuário.
- Mantenha `dangerouslyAllowInheritedWebhookPath` desativado, a menos que você aceite explicitamente o risco de roteamento por caminho compartilhado em uma configuração com várias contas.

## Solução de problemas

- `Missing required fields (token, user_id, text)`:
  - a carga do webhook de saída está sem um dos campos obrigatórios
  - se o Synology enviar o token nos cabeçalhos, verifique se o gateway/proxy preserva esses cabeçalhos
- `Invalid token`:
  - o segredo do webhook de saída não corresponde a `channels.synology-chat.token`
  - a solicitação está atingindo a conta/caminho de webhook errado
  - um proxy reverso removeu o cabeçalho do token antes que a solicitação chegasse ao OpenClaw
- `Rate limit exceeded`:
  - muitas tentativas de token inválido da mesma origem podem bloquear temporariamente essa origem
  - remetentes autenticados também têm um limite de taxa separado por usuário para mensagens
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open.`:
  - `dmPolicy="allowlist"` está habilitado, mas nenhum usuário foi configurado
- `User not authorized`:
  - o `user_id` numérico do remetente não está em `allowedUserIds`

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e endurecimento
