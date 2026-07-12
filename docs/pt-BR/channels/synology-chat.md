---
read_when:
    - Configurando o Synology Chat com o OpenClaw
    - Depuração do roteamento de Webhook do Synology Chat
summary: Configuração do webhook do Synology Chat e do OpenClaw
title: Synology Chat
x-i18n:
    generated_at: "2026-07-12T14:55:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

O Synology Chat se conecta ao OpenClaw por meio de um par de webhooks: um webhook de saída do Synology Chat envia mensagens diretas recebidas ao Gateway, e as respostas retornam por meio de um webhook de entrada do Synology Chat.

Status: plugin oficial, instalado separadamente. Somente mensagens diretas; há suporte para texto e envio de arquivos baseado em URL.

## Instalação

```bash
openclaw plugins install @openclaw/synology-chat
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

1. Instale o plugin (acima).
2. Nas integrações do Synology Chat:
   - Crie um webhook de entrada e copie sua URL.
   - Crie um webhook de saída com seu token secreto.
3. Direcione a URL do webhook de saída para o Gateway do OpenClaw:
   - `https://gateway-host/webhook/synology` por padrão.
   - Ou seu `channels.synology-chat.webhookPath` personalizado.
4. Conclua a configuração no OpenClaw. O Synology Chat aparece na mesma lista de configuração de canais em ambos os fluxos:
   - Guiado: `openclaw onboard` ou `openclaw channels add`
   - Direto: `openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. Reinicie o Gateway e envie uma mensagem direta para o bot do Synology Chat.

Detalhes da autenticação do webhook:

- O OpenClaw aceita o token do webhook de saída primeiro de `body.token`, depois de
  `?token=...` e, por fim, dos cabeçalhos.
- Formatos de cabeçalho aceitos:
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- Tokens vazios ou ausentes causam falha de forma restritiva.
- As cargas podem ser `application/x-www-form-urlencoded` ou `application/json`; `token`, `user_id` e `text` são obrigatórios.

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
- `SYNOLOGY_ALLOWED_USER_IDS` (separados por vírgulas)
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

Os valores de configuração substituem as variáveis de ambiente.

`SYNOLOGY_CHAT_INCOMING_URL` e `SYNOLOGY_NAS_HOST` não podem ser definidos em um `.env` do espaço de trabalho; consulte [Arquivos `.env` do espaço de trabalho](/pt-BR/gateway/security#workspace-env-files).

## Política de mensagens diretas e controle de acesso

- Valores de `dmPolicy` compatíveis: `allowlist` (padrão), `open` e `disabled`. O Synology Chat não tem fluxo de pareamento; aprove remetentes adicionando seus IDs numéricos de usuário do Synology a `allowedUserIds`.
- `allowedUserIds` aceita uma lista (ou string separada por vírgulas) de IDs de usuário do Synology.
- No modo `allowlist`, uma lista `allowedUserIds` vazia é tratada como configuração incorreta, e a rota do webhook não será iniciada.
- `dmPolicy: "open"` permite mensagens diretas públicas somente quando `allowedUserIds` inclui `"*"`; com entradas restritivas, somente usuários correspondentes podem conversar. `open` com uma lista `allowedUserIds` vazia também impede o início da rota.
- `dmPolicy: "disabled"` bloqueia mensagens diretas.
- Por padrão, a vinculação do destinatário da resposta permanece no `user_id` numérico estável. `channels.synology-chat.dangerouslyAllowNameMatching: true` é um modo de compatibilidade emergencial que reativa a pesquisa por nome de usuário/apelido mutável para a entrega de respostas.

## Entrega de saída

Use IDs numéricos de usuário do Synology Chat como destinos. Os prefixos `synology-chat:`, `synology_chat:` e `synology:` são aceitos.

Exemplos:

```bash
openclaw message send --channel synology-chat --target 123456 --message "Olá do OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Olá novamente"
openclaw message send --channel synology-chat --target synology:123456 --message "Prefixo curto"
```

O texto de saída é dividido em blocos de 2000 caracteres. Há suporte para envio de mídia por entrega de arquivo baseada em URL: o NAS baixa e anexa o arquivo (máximo de 32 MB). As URLs de arquivos de saída devem usar `http` ou `https`, e destinos de rede privados ou bloqueados de outra forma são rejeitados antes que o OpenClaw encaminhe a URL ao webhook do NAS.

## Várias contas

Há suporte para várias contas do Synology Chat em `channels.synology-chat.accounts`.
Cada conta pode substituir o token, a URL de entrada, o caminho do webhook, a política de mensagens diretas e os limites.
As sessões de mensagens diretas são isoladas por conta e usuário, portanto o mesmo `user_id` numérico
em duas contas diferentes do Synology não compartilha o estado da transcrição.
Defina um `webhookPath` distinto para cada conta habilitada. O OpenClaw rejeita caminhos exatamente duplicados
e se recusa a iniciar contas nomeadas que apenas herdam um caminho de webhook compartilhado em configurações com várias contas.
Se você precisar intencionalmente de herança legada para uma conta nomeada, defina
`dangerouslyAllowInheritedWebhookPath: true` nessa conta ou em `channels.synology-chat`,
mas caminhos exatamente duplicados ainda serão rejeitados de forma restritiva. Prefira caminhos explícitos por conta.

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

## Notas de segurança

- Mantenha `token` em segredo e faça sua rotação se ele vazar.
- Mantenha `allowInsecureSsl: false`, a menos que você confie explicitamente em um certificado local autoassinado do NAS.
- As solicitações recebidas pelo webhook têm o token verificado e são limitadas por remetente (`rateLimitPerMinute`, padrão 30).
- As verificações de token inválido usam comparação de segredo em tempo constante e falham de forma restritiva; tentativas repetidas com token inválido bloqueiam temporariamente o endereço IP de origem.
- O texto das mensagens recebidas é sanitizado contra padrões conhecidos de injeção de prompt e truncado em 4000 caracteres.
- Prefira `dmPolicy: "allowlist"` para produção.
- Mantenha `dangerouslyAllowNameMatching` desativado, a menos que você precise explicitamente da entrega legada de respostas baseada em nome de usuário.
- Mantenha `dangerouslyAllowInheritedWebhookPath` desativado, a menos que você aceite explicitamente o risco de roteamento por caminho compartilhado em uma configuração com várias contas.

## Solução de problemas

- `Missing required fields (token, user_id, text)`:
  - a carga do webhook de saída não contém um dos campos obrigatórios
  - se o Synology enviar o token nos cabeçalhos, certifique-se de que o gateway/proxy preserve esses cabeçalhos
- `Invalid token`:
  - o segredo do webhook de saída não corresponde a `channels.synology-chat.token`
  - a solicitação está chegando à conta ou ao caminho de webhook incorreto
  - um proxy reverso removeu o cabeçalho do token antes que a solicitação chegasse ao OpenClaw
- `Rate limit exceeded`:
  - muitas tentativas com token inválido provenientes da mesma origem podem bloquear temporariamente essa origem
  - remetentes autenticados também têm um limite separado de frequência de mensagens por usuário
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`:
  - `dmPolicy="allowlist"` está habilitado, mas nenhum usuário está configurado
- `User not authorized`:
  - o `user_id` numérico do remetente não está em `allowedUserIds`

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Grupos](/pt-BR/channels/groups) — comportamento de conversas em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
