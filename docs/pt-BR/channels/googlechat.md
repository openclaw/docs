---
read_when:
    - Trabalhando nos recursos do canal do Google Chat
summary: Status, recursos e configuração do aplicativo Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-11T23:43:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 72a08c41f7da019f91265cbf7ae73134a0767c603449ebd8cd9a5354936a3b52
    source_path: channels/googlechat.md
    workflow: 16
---

O Google Chat funciona como o plugin oficial `@openclaw/googlechat`: mensagens diretas e espaços por meio de Webhooks da API Google Chat (somente endpoint HTTP, sem Pub/Sub).

## Instalação

```bash
openclaw plugins install @openclaw/googlechat
```

Checkout local (ao executar a partir de um repositório Git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Configuração rápida (iniciantes)

1. Crie um projeto do Google Cloud e ative a **Google Chat API**.
   - Acesse: [Credenciais da API Google Chat](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Ative a API caso ainda não esteja ativada.
2. Crie uma **conta de serviço**:
   - Pressione **Create Credentials** > **Service Account**.
   - Dê o nome que quiser (por exemplo, `openclaw-chat`).
   - Deixe as permissões e entidades principais em branco (**Continue** e depois **Done**).
3. Crie e baixe a **chave JSON**:
   - Clique na nova conta de serviço > guia **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. Armazene o arquivo JSON baixado no host do Gateway (por exemplo, `~/.openclaw/googlechat-service-account.json`).
5. Crie um aplicativo do Google Chat na [configuração do Chat no Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Preencha **Application info** (nome do aplicativo, URL do avatar e descrição).
   - Ative **Interactive features**.
   - Em **Functionality**, marque **Join spaces and group conversations**.
   - Em **Connection settings**, selecione **HTTP endpoint URL**.
   - Em **Triggers**, selecione **Use a common HTTP endpoint URL for all triggers** e defina-a como a URL pública do Gateway seguida por `/googlechat` (consulte [URL pública](#public-url-webhook-only)).
   - Em **Visibility**, marque **Make this Chat app available to specific people and groups in `<Your Domain>`** e informe seu endereço de e-mail.
   - Clique em **Save**.
6. Ative o status do aplicativo: atualize a página, localize **App status**, defina-o como **Live - available to users** e clique novamente em **Save**.
7. Configure o OpenClaw com a conta de serviço e o público do Webhook (deve corresponder à configuração do aplicativo do Chat):
   - Variável de ambiente: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (somente conta padrão); ou
   - Configuração: consulte [Destaques da configuração](#config-highlights). `openclaw channels add --channel googlechat` também aceita `--audience-type`, `--audience`, `--webhook-path` e `--webhook-url`.
8. Inicie o Gateway. O Google Chat enviará solicitações POST ao caminho do Webhook (por padrão, `/googlechat`).

## Adicionar ao Google Chat

Quando o Gateway estiver em execução e seu e-mail estiver na lista de visibilidade:

1. Acesse o [Google Chat](https://chat.google.com/).
2. Clique no ícone **+** (mais) ao lado de **Direct Messages**.
3. Pesquise o **App name** que você configurou no Google Cloud Console.
   - O bot _não_ aparece na lista de navegação do Marketplace porque é um aplicativo privado; pesquise-o pelo nome.
4. Selecione o bot, clique em **Add** ou **Chat** e envie uma mensagem.

## URL pública (somente Webhook)

Os Webhooks do Google Chat exigem um endpoint HTTPS público. Por segurança, exponha **somente o caminho `/googlechat`** à internet e mantenha o painel do OpenClaw e os demais endpoints privados.

### Opção A: Tailscale Funnel (recomendada)

Use o Tailscale Serve para o painel privado e o Funnel para o caminho público do Webhook.

1. Verifique a qual endereço seu Gateway está vinculado:

   ```bash
   ss -tlnp | grep 18789
   ```

   Anote o IP (por exemplo, `127.0.0.1`, `0.0.0.0` ou um endereço Tailscale `100.x.x.x`).

2. Exponha o painel somente à tailnet (porta 8443):

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to a Tailscale IP only:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Exponha publicamente somente o caminho do Webhook:

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to a Tailscale IP only:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Se solicitado, acesse a URL de autorização exibida na saída para ativar o Funnel neste Node.

5. Verifique:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

A URL pública do Webhook é `https://<node-name>.<tailnet>.ts.net/googlechat`; o painel permanece acessível somente pela tailnet em `https://<node-name>.<tailnet>.ts.net:8443/`. Use a URL pública (sem `:8443`) na configuração do aplicativo do Google Chat.

> Observação: esta configuração persiste após reinicializações. Remova-a posteriormente com `tailscale funnel reset` e `tailscale serve reset`.

### Opção B: proxy reverso (Caddy)

Encaminhe somente o caminho do Webhook:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

As solicitações para `your-domain.com/` são ignoradas ou retornam 404, enquanto `your-domain.com/googlechat` é encaminhado ao OpenClaw.

### Opção C: Cloudflare Tunnel

Configure as regras de entrada do túnel para encaminhar somente o caminho do Webhook:

- **Caminho**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Regra padrão**: HTTP 404 (não encontrado)

## Como funciona

1. O Google Chat envia JSON por POST ao caminho do Webhook do Gateway (somente POST, tipo de conteúdo JSON obrigatório e limite de frequência por IP).
2. O OpenClaw autentica cada solicitação antes do encaminhamento:
   - Os eventos do aplicativo do Chat contêm `Authorization: Bearer <token>`; o token é verificado antes que o corpo completo seja analisado.
   - Os eventos de complementos do Google Workspace contêm o token no corpo (`authorizationEventObject.systemIdToken`) e são lidos sob um limite de pré-autenticação mais rigoroso (16 KB, 3 s) antes da verificação.
3. O token é verificado em relação a `audienceType` + `audience`:
   - `audienceType: "app-url"` → o público é a URL HTTPS do seu Webhook.
   - `audienceType: "project-number"` → o público é o número do projeto do Cloud.
   - Tokens de complementos com `app-url` também exigem que `appPrincipal` seja definido como o ID numérico do cliente OAuth 2.0 do aplicativo (21 dígitos, não um e-mail); caso contrário, a verificação falha e um aviso é registrado.
4. As mensagens são encaminhadas por espaço:
   - Os espaços recebem sessões por espaço `agent:<agentId>:googlechat:group:<spaceId>`; as respostas são enviadas à conversa da mensagem.
   - Por padrão, as mensagens diretas são agrupadas na sessão principal do agente; defina `session.dmScope` para ter sessões de mensagens diretas por interlocutor (consulte [Sessão](/pt-BR/concepts/session)).
5. Por padrão, o acesso por mensagem direta usa pareamento. Remetentes desconhecidos recebem um código de pareamento; aprove-o com:
   - `openclaw pairing approve googlechat <code>`
6. Por padrão, os espaços de grupo exigem uma menção com @. As menções são detectadas pelas anotações `USER_MENTION` do Chat direcionadas ao aplicativo; defina `botUser` (por exemplo, `users/1234567890`) caso a detecção precise do nome de recurso do usuário do aplicativo.
7. Quando uma aprovação de execução ou Plugin é iniciada pelo Google Chat e um aprovador estável `users/<id>` está configurado, o OpenClaw publica um cartão de aprovação nativo (`cardsV2`) no espaço ou na conversa de origem. Os botões do cartão contêm tokens opacos de callback; a solicitação manual `/approve <id> <decision>` aparece somente quando a entrega nativa não está disponível.

## Destinos

Use estes identificadores para entregas e listas de permissões:

- Mensagens diretas: `users/<userId>` (recomendado).
- Espaços: `spaces/<spaceId>`.
- O e-mail bruto `name@example.com` é mutável e usado para correspondência em listas de permissões somente quando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsoleto: `users/<email>` é tratado como ID de usuário, não como uma entrada de e-mail na lista de permissões.
- Os prefixos `googlechat:`, `google-chat:` e `gchat:` são aceitos e removidos.

## Destaques da configuração

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // add-on verification only; numeric OAuth client ID
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
      allowBots: false,
      dm: {
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": {
          enabled: true,
          requireMention: true,
          users: ["users/1234567890"],
          systemPrompt: "Short answers only.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Observações:

- Credenciais da conta de serviço: `serviceAccountFile` (caminho), `serviceAccount` (string JSON ou objeto embutido) ou `serviceAccountRef` (SecretRef de variável de ambiente/arquivo). As variáveis de ambiente `GOOGLE_CHAT_SERVICE_ACCOUNT` (JSON embutido) e `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (caminho) aplicam-se somente à conta padrão. Configurações com várias contas usam `channels.googlechat.accounts.<id>` com as mesmas chaves, incluindo `serviceAccountRef` por conta.
- O caminho padrão do Webhook é `/googlechat` quando `webhookPath` não está definido; `webhookUrl` pode fornecer o caminho em seu lugar.
- As chaves de grupo devem ser IDs de espaço estáveis (`spaces/<spaceId>`). Chaves com nomes de exibição estão obsoletas e são registradas como tal.
- `dangerouslyAllowNameMatching` reativa a correspondência de entidades principais por e-mail mutável em listas de permissões (modo de compatibilidade para emergências); o doctor alerta sobre entradas de e-mail.
- As ações de reação do Google Chat não são expostas. O Plugin usa autenticação por conta de serviço, enquanto os endpoints de reação do Google Chat exigem autenticação de usuário. A configuração existente `actions.reactions` é aceita por compatibilidade, mas não tem efeito.
- Os cartões de aprovação nativos usam cliques nos botões `cardsV2` do Google Chat, não eventos de reação. Os aprovadores vêm de `dm.allowFrom` ou `defaultTo` e devem ser valores numéricos estáveis no formato `users/<id>`.
- As ações de mensagem expõem somente o envio de texto com `send`. O envio de anexos do Google Chat exige autenticação de usuário, enquanto este Plugin usa autenticação por conta de serviço; portanto, o envio de arquivos não é exposto.
- `typingIndicator`: `message` (padrão) publica um espaço reservado `_<Bot> is typing..._` e o edita para se tornar a primeira resposta; `none` o desativa; `reaction` exige OAuth de usuário e, no momento, recorre a `message`, registrando um erro quando usada autenticação por conta de serviço.
- Os anexos recebidos (o primeiro anexo de cada mensagem) são baixados pela API Chat para o pipeline de mídia, limitados por `mediaMaxMb` (padrão: 20).
- Por padrão, mensagens criadas por bots são ignoradas. Com `allowBots: true`, as mensagens de bots aceitas usam a [proteção compartilhada contra loops de bots](/pt-BR/channels/bot-loop-protection): configure `channels.defaults.botLoopProtection` e depois substitua com `channels.googlechat.botLoopProtection` ou `channels.googlechat.groups.<space>.botLoopProtection`.

Detalhes sobre referências a segredos: [Gerenciamento de segredos](/pt-BR/gateway/secrets).

## Solução de problemas

### Método 405 não permitido

Se o Explorador de registros do Google Cloud mostrar erros como:

```text
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

O manipulador do Webhook não está registrado. Causas comuns:

1. **Canal não configurado**: a seção `channels.googlechat` está ausente. Verifique com:

   ```bash
   openclaw config get channels.googlechat
   ```

   Se retornar "Config path not found", adicione a configuração (consulte [Destaques da configuração](#config-highlights)).

2. **Plugin não ativado**: verifique o status do Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Se mostrar "disabled", adicione `plugins.entries.googlechat.enabled: true` à sua configuração.

3. **Gateway não reiniciado** após alterações na configuração:

   ```bash
   openclaw gateway restart
   ```

Verifique se o canal está em execução:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Outros problemas

- `openclaw channels status --probe` exibe erros de autenticação e configurações de público ausentes (`audience` e `audienceType` são obrigatórios).
- Se nenhuma mensagem chegar, confirme a URL do Webhook e a configuração de acionadores do aplicativo do Chat.
- Se a exigência de menção bloquear respostas, defina `botUser` como o nome de recurso do usuário do aplicativo e verifique `requireMention`.
- Executar `openclaw logs --follow` ao enviar uma mensagem de teste mostra se as solicitações chegam ao Gateway.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Configuração do Gateway](/pt-BR/gateway/configuration)
- [Grupos](/pt-BR/channels/groups) — comportamento de chats em grupo e controle de menções
- [Pareamento](/pt-BR/channels/pairing) — autenticação por mensagem direta e fluxo de pareamento
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção do sistema
