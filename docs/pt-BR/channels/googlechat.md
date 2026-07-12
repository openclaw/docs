---
read_when:
    - Trabalhando nos recursos do canal do Google Chat
summary: Status, recursos e configuração do app Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-07-12T14:53:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
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

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Configuração rápida (iniciante)

1. Crie um projeto do Google Cloud e ative a **Google Chat API**.
   - Acesse: [Credenciais da Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Ative a API se ela ainda não estiver ativada.
2. Crie uma **Service Account**:
   - Clique em **Create Credentials** > **Service Account**.
   - Dê o nome que quiser (por exemplo, `openclaw-chat`).
   - Deixe as permissões e os principais em branco (**Continue** e depois **Done**).
3. Crie e baixe a **chave JSON**:
   - Clique na nova conta de serviço > guia **Keys** > **Add Key** > **Create new key** > **JSON** > **Create**.
4. Armazene o arquivo JSON baixado no host do Gateway (por exemplo, `~/.openclaw/googlechat-service-account.json`).
5. Crie um aplicativo do Google Chat em [Configuração do Chat no Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Preencha **Application info** (nome do aplicativo, URL do avatar e descrição).
   - Ative **Interactive features**.
   - Em **Functionality**, marque **Join spaces and group conversations**.
   - Em **Connection settings**, selecione **HTTP endpoint URL**.
   - Em **Triggers**, selecione **Use a common HTTP endpoint URL for all triggers** e defina-o como a URL pública do Gateway seguida de `/googlechat` (consulte [URL pública](#public-url-webhook-only)).
   - Em **Visibility**, marque **Make this Chat app available to specific people and groups in `<Your Domain>`** e insira seu endereço de e-mail.
   - Clique em **Save**.
6. Ative o status do aplicativo: atualize a página, encontre **App status**, defina-o como **Live - available to users** e clique novamente em **Save**.
7. Configure o OpenClaw com a conta de serviço e o público-alvo do Webhook (deve corresponder à configuração do aplicativo do Chat):
   - Variável de ambiente: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json` (somente para a conta padrão), ou
   - Configuração: consulte [Destaques da configuração](#config-highlights). `openclaw channels add --channel googlechat` também aceita `--audience-type`, `--audience`, `--webhook-path` e `--webhook-url`.
8. Inicie o Gateway. O Google Chat enviará uma solicitação POST para o caminho do seu Webhook (o padrão é `/googlechat`).

## Adicionar ao Google Chat

Quando o Gateway estiver em execução e seu e-mail estiver na lista de visibilidade:

1. Acesse o [Google Chat](https://chat.google.com/).
2. Clique no ícone **+** (mais) ao lado de **Direct Messages**.
3. Pesquise o **App name** que você configurou no Google Cloud Console.
   - O bot _não_ aparece na lista de navegação do Marketplace porque é um aplicativo privado; pesquise-o pelo nome.
4. Selecione o bot, clique em **Add** ou **Chat** e envie uma mensagem.

## URL pública (somente Webhook)

Os Webhooks do Google Chat exigem um endpoint HTTPS público. Por segurança, exponha **somente o caminho `/googlechat`** à internet e mantenha o painel do OpenClaw e os outros endpoints privados.

### Opção A: Tailscale Funnel (recomendado)

Use o Tailscale Serve para o painel privado e o Funnel para o caminho público do Webhook.

1. Verifique a qual endereço seu Gateway está vinculado:

   ```bash
   ss -tlnp | grep 18789
   ```

   Anote o IP (por exemplo, `127.0.0.1`, `0.0.0.0` ou um endereço Tailscale `100.x.x.x`).

2. Exponha o painel somente à tailnet (porta 8443):

   ```bash
   # Se estiver vinculado ao localhost (127.0.0.1 ou 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # Se estiver vinculado somente a um IP do Tailscale:
   tailscale serve --bg --https 8443 http://100.x.x.x:18789
   ```

3. Exponha publicamente somente o caminho do Webhook:

   ```bash
   # Se estiver vinculado ao localhost (127.0.0.1 ou 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # Se estiver vinculado somente a um IP do Tailscale:
   tailscale funnel --bg --set-path /googlechat http://100.x.x.x:18789/googlechat
   ```

4. Se solicitado, acesse a URL de autorização exibida na saída para ativar o Funnel para este Node.

5. Verifique:

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

A URL pública do seu Webhook é `https://<node-name>.<tailnet>.ts.net/googlechat`; o painel permanece acessível somente pela tailnet em `https://<node-name>.<tailnet>.ts.net:8443/`. Use a URL pública (sem `:8443`) na configuração do aplicativo do Google Chat.

> Observação: esta configuração persiste após reinicializações. Para removê-la posteriormente, use `tailscale funnel reset` e `tailscale serve reset`.

### Opção B: proxy reverso (Caddy)

Encaminhe somente o caminho do Webhook:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

As solicitações para `your-domain.com/` são ignoradas ou retornam 404, enquanto `your-domain.com/googlechat` é encaminhado para o OpenClaw.

### Opção C: Cloudflare Tunnel

Configure as regras de entrada do túnel para rotear somente o caminho do Webhook:

- **Caminho**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Regra padrão**: HTTP 404 (Não encontrado)

## Como funciona

1. O Google Chat envia JSON via POST para o caminho do Webhook do Gateway (somente POST, tipo de conteúdo JSON obrigatório, com limitação de taxa por IP).
2. O OpenClaw autentica todas as solicitações antes de encaminhá-las:
   - Os eventos do app de chat incluem `Authorization: Bearer <token>`; o token é verificado antes que o corpo completo seja analisado.
   - Os eventos de complementos do Google Workspace incluem o token no corpo (`authorizationEventObject.systemIdToken`) e são lidos sob um limite de pré-autenticação mais rigoroso (16 KB, 3 s) antes da verificação.
3. O token é verificado em relação a `audienceType` + `audience`:
   - `audienceType: "app-url"` → o público é a URL HTTPS do seu Webhook.
   - `audienceType: "project-number"` → o público é o número do projeto do Cloud.
   - Os tokens de complementos com `app-url` também exigem que `appPrincipal` seja definido como o ID numérico do cliente OAuth 2.0 do app (21 dígitos, não um e-mail); caso contrário, a verificação falha e um aviso é registrado.
4. As mensagens são roteadas por espaço:
   - Os espaços recebem sessões por espaço `agent:<agentId>:googlechat:group:<spaceId>`; as respostas são enviadas para a conversa da mensagem.
   - Por padrão, as mensagens diretas são consolidadas na sessão principal do agente; defina `session.dmScope` para ter sessões de mensagem direta por par (consulte [Sessão](/pt-BR/concepts/session)).
5. Por padrão, o acesso por mensagem direta usa emparelhamento. Remetentes desconhecidos recebem um código de emparelhamento; aprove com:
   - `openclaw pairing approve googlechat <code>`
6. Por padrão, os espaços de grupo exigem uma @menção. As menções são detectadas pelas anotações `USER_MENTION` do Chat direcionadas ao app; defina `botUser` (por exemplo, `users/1234567890`) se a detecção precisar do nome do recurso de usuário do app.
7. Quando uma aprovação de execução ou Plugin é iniciada no Google Chat e um aprovador estável `users/<id>` está configurado, o OpenClaw publica um cartão de aprovação nativo (`cardsV2`) no espaço ou na conversa de origem. Os botões do cartão contêm tokens opacos de callback; a solicitação manual `/approve <id> <decision>` aparece somente quando a entrega nativa não está disponível.

## Destinos

Use estes identificadores para entrega e listas de permissões:

- Mensagens diretas: `users/<userId>` (recomendado).
- Espaços: `spaces/<spaceId>`.
- O e-mail bruto `name@example.com` é mutável e usado para correspondência com a lista de permissões somente quando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsoleto: `users/<email>` é tratado como um ID de usuário, não como uma entrada de e-mail na lista de permissões.
- Os prefixos `googlechat:`, `google-chat:` e `gchat:` são aceitos e removidos.

## Destaques da configuração

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // ou serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      appPrincipal: "123456789012345678901", // somente verificação de complemento; ID numérico do cliente OAuth
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // opcional; ajuda na detecção de menções
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
          systemPrompt: "Somente respostas curtas.",
        },
      },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Observações:

- Credenciais da conta de serviço: `serviceAccountFile` (caminho), `serviceAccount` (string JSON ou objeto em linha) ou `serviceAccountRef` (SecretRef de ambiente/arquivo). As variáveis de ambiente `GOOGLE_CHAT_SERVICE_ACCOUNT` (JSON em linha) e `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (caminho) aplicam-se somente à conta padrão. Configurações com várias contas usam `channels.googlechat.accounts.<id>` com as mesmas chaves, incluindo `serviceAccountRef` por conta.
- O caminho padrão do Webhook é `/googlechat` quando `webhookPath` não está definido; `webhookUrl` pode fornecer o caminho em seu lugar.
- As chaves de grupo devem ser IDs de espaço estáveis (`spaces/<spaceId>`). Chaves de nome de exibição estão obsoletas e são registradas como tal.
- `dangerouslyAllowNameMatching` reativa a correspondência de principais de e-mail mutáveis para listas de permissões (modo de compatibilidade emergencial); o doctor alerta sobre entradas de e-mail.
- As ações de reação do Google Chat não são expostas. O Plugin usa autenticação de conta de serviço, enquanto os endpoints de reação do Google Chat exigem autenticação de usuário. A configuração existente `actions.reactions` é aceita para compatibilidade, mas não tem efeito.
- Os cartões de aprovação nativos usam cliques nos botões `cardsV2` do Google Chat, não eventos de reação. Os aprovadores vêm de `dm.allowFrom` ou `defaultTo` e devem ser valores numéricos estáveis no formato `users/<id>`.
- As ações de mensagem expõem somente o envio de texto com `send`. O upload de anexos do Google Chat exige autenticação de usuário, enquanto este Plugin usa autenticação de conta de serviço; portanto, o upload de arquivos de saída não é exposto.
- `typingIndicator`: `message` (padrão) publica um espaço reservado `_<Bot> is typing..._` e o edita para transformá-lo na primeira resposta; `none` o desativa; `reaction` exige OAuth de usuário e atualmente recorre a `message`, registrando um erro sob autenticação de conta de serviço.
- Os anexos recebidos (o primeiro anexo de cada mensagem) são baixados por meio da API Chat para o pipeline de mídia, limitados por `mediaMaxMb` (padrão 20).
- Por padrão, as mensagens criadas por bots são ignoradas. Com `allowBots: true`, as mensagens de bot aceitas usam a [proteção compartilhada contra loops de bots](/pt-BR/channels/bot-loop-protection): configure `channels.defaults.botLoopProtection` e substitua com `channels.googlechat.botLoopProtection` ou `channels.googlechat.groups.<space>.botLoopProtection`.

Detalhes sobre referências de segredos: [Gerenciamento de segredos](/pt-BR/gateway/secrets).

## Solução de problemas

### 405 Método não permitido

Se o Google Cloud Logs Explorer mostrar erros como:

```text
código de status: 405, frase de motivo: resposta de erro HTTP: HTTP/1.1 405 Método Não Permitido
```

O manipulador de webhook não está registrado. Causas comuns:

1. **Canal não configurado**: a seção `channels.googlechat` está ausente. Verifique com:

   ```bash
   openclaw config get channels.googlechat
   ```

   Se retornar "Caminho de configuração não encontrado", adicione a configuração (consulte [Destaques da configuração](#config-highlights)).

2. **Plugin não habilitado**: verifique o status do plugin:

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
# Deve mostrar: Google Chat default: enabled, configured, ...
```

### Outros problemas

- `openclaw channels status --probe` exibe erros de autenticação e configuração de público ausente (`audience` e `audienceType` são ambos obrigatórios).
- Se nenhuma mensagem chegar, confirme a URL do webhook e a configuração do gatilho do app do Chat.
- Se a exigência de menção bloquear respostas, defina `botUser` como o nome do recurso de usuário do app e verifique `requireMention`.
- Executar `openclaw logs --follow` ao enviar uma mensagem de teste mostra se as solicitações chegam ao Gateway.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Configuração do Gateway](/pt-BR/gateway/configuration)
- [Grupos](/pt-BR/channels/groups) — comportamento do chat em grupo e controle por menções
- [Pareamento](/pt-BR/channels/pairing) — autenticação por mensagem direta e fluxo de pareamento
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
