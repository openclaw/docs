---
read_when:
    - Trabalhando nos recursos do canal Google Chat
summary: Status de suporte, recursos e configuração do app Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-05-04T02:21:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: afa2ca4d9673396aa24a55ca5855a34ad26a4640c3a1f6928dbf7246e403cb04
    source_path: channels/googlechat.md
    workflow: 16
---

Status: Plugin baixável para DMs + espaços via webhooks da Google Chat API (somente HTTP).

## Instalação

Instale o Google Chat antes de configurar o canal:

```bash
openclaw plugins install @openclaw/googlechat
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Configuração rápida (iniciante)

1. Crie um projeto do Google Cloud e habilite a **Google Chat API**.
   - Acesse: [Credenciais da Google Chat API](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Habilite a API se ela ainda não estiver habilitada.
2. Crie uma **Conta de serviço**:
   - Pressione **Create Credentials** > **Service Account**.
   - Dê o nome que quiser (por exemplo, `openclaw-chat`).
   - Deixe as permissões em branco (pressione **Continue**).
   - Deixe os principais com acesso em branco (pressione **Done**).
3. Crie e baixe a **Chave JSON**:
   - Na lista de contas de serviço, clique naquela que você acabou de criar.
   - Acesse a aba **Keys**.
   - Clique em **Add Key** > **Create new key**.
   - Selecione **JSON** e pressione **Create**.
4. Armazene o arquivo JSON baixado no host do seu Gateway (por exemplo, `~/.openclaw/googlechat-service-account.json`).
5. Crie um app do Google Chat na [Configuração do Chat no Google Cloud Console](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Preencha as **Informações do aplicativo**:
     - **Nome do app**: (por exemplo, `OpenClaw`)
     - **URL do avatar**: (por exemplo, `https://openclaw.ai/logo.png`)
     - **Descrição**: (por exemplo, `Assistente pessoal de IA`)
   - Habilite **Recursos interativos**.
   - Em **Funcionalidade**, marque **Participar de espaços e conversas em grupo**.
   - Em **Configurações de conexão**, selecione **URL de endpoint HTTP**.
   - Em **Gatilhos**, selecione **Usar uma URL de endpoint HTTP comum para todos os gatilhos** e defina-a como a URL pública do seu Gateway seguida de `/googlechat`.
     - _Dica: execute `openclaw status` para encontrar a URL pública do seu Gateway._
   - Em **Visibilidade**, marque **Tornar este app do Chat disponível para pessoas e grupos específicos em `<Your Domain>`**.
   - Insira seu endereço de email (por exemplo, `user@example.com`) na caixa de texto.
   - Clique em **Save** na parte inferior.
6. **Habilite o status do app**:
   - Depois de salvar, **atualize a página**.
   - Procure a seção **Status do app** (geralmente perto do topo ou da parte inferior depois de salvar).
   - Altere o status para **Live - available to users**.
   - Clique em **Save** novamente.
7. Configure o OpenClaw com o caminho da conta de serviço + público do Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Ou config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Defina o tipo + valor do público do Webhook (corresponde à configuração do seu app do Chat).
9. Inicie o Gateway. O Google Chat enviará POST para o caminho do seu Webhook.

## Adicionar ao Google Chat

Depois que o Gateway estiver em execução e seu email for adicionado à lista de visibilidade:

1. Acesse [Google Chat](https://chat.google.com/).
2. Clique no ícone **+** (mais) ao lado de **Mensagens diretas**.
3. Na barra de pesquisa (onde você geralmente adiciona pessoas), digite o **Nome do app** que você configurou no Google Cloud Console.
   - **Observação**: o bot _não_ aparecerá na lista de navegação do "Marketplace" porque é um app privado. Você deve pesquisá-lo pelo nome.
4. Selecione seu bot nos resultados.
5. Clique em **Adicionar** ou **Chat** para iniciar uma conversa 1:1.
6. Envie "Olá" para acionar o assistente!

## URL pública (somente Webhook)

Webhooks do Google Chat exigem um endpoint HTTPS público. Por segurança, **exponha somente o caminho `/googlechat`** para a internet. Mantenha o painel do OpenClaw e outros endpoints sensíveis na sua rede privada.

### Opção A: Tailscale Funnel (recomendado)

Use o Tailscale Serve para o painel privado e o Funnel para o caminho público do Webhook. Isso mantém `/` privado enquanto expõe somente `/googlechat`.

1. **Verifique a qual endereço seu Gateway está vinculado:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Observe o endereço IP (por exemplo, `127.0.0.1`, `0.0.0.0` ou seu IP do Tailscale, como `100.x.x.x`).

2. **Exponha o painel apenas para a tailnet (porta 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Exponha publicamente somente o caminho do Webhook:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorize o nó para acesso ao Funnel:**
   Se solicitado, acesse a URL de autorização exibida na saída para habilitar o Funnel para este nó na política da sua tailnet.

5. **Verifique a configuração:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Sua URL pública do Webhook será:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Seu painel privado permanece acessível apenas pela tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Use a URL pública (sem `:8443`) na configuração do app do Google Chat.

> Observação: esta configuração persiste entre reinicializações. Para removê-la depois, execute `tailscale funnel reset` e `tailscale serve reset`.

### Opção B: proxy reverso (Caddy)

Se você usa um proxy reverso como o Caddy, encaminhe somente o caminho específico:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Com esta configuração, qualquer solicitação para `your-domain.com/` será ignorada ou retornará 404, enquanto `your-domain.com/googlechat` será roteado com segurança para o OpenClaw.

### Opção C: Cloudflare Tunnel

Configure as regras de ingresso do seu túnel para rotear somente o caminho do Webhook:

- **Caminho**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Regra padrão**: HTTP 404 (Não encontrado)

## Como funciona

1. O Google Chat envia POSTs de Webhook para o Gateway. Cada solicitação inclui um cabeçalho `Authorization: Bearer <token>`.
   - O OpenClaw verifica a autenticação bearer antes de ler/analisar corpos completos de Webhook quando o cabeçalho está presente.
   - Solicitações do Google Workspace Add-on que carregam `authorizationEventObject.systemIdToken` no corpo são compatíveis por meio de um orçamento de corpo pré-autenticação mais rigoroso.
2. O OpenClaw verifica o token em relação ao `audienceType` + `audience` configurados:
   - `audienceType: "app-url"` → o público é a URL HTTPS do seu Webhook.
   - `audienceType: "project-number"` → o público é o número do projeto Cloud.
3. As mensagens são roteadas por espaço:
   - DMs usam a chave de sessão `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Espaços usam a chave de sessão `agent:<agentId>:googlechat:group:<spaceId>`.
4. O acesso por DM usa emparelhamento por padrão. Remetentes desconhecidos recebem um código de emparelhamento; aprove com:
   - `openclaw pairing approve googlechat <code>`
5. Espaços de grupo exigem @-menção por padrão. Use `botUser` se a detecção de menção precisar do nome de usuário do app.

## Destinos

Use estes identificadores para entrega e listas de permissões:

- Mensagens diretas: `users/<userId>` (recomendado).
- Email bruto `name@example.com` é mutável e usado somente para correspondência direta de lista de permissões quando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsoleto: `users/<email>` é tratado como um id de usuário, não como uma lista de permissões de email.
- Espaços: `spaces/<spaceId>`.

## Destaques de configuração

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      // or serviceAccountRef: { source: "file", provider: "filemain", id: "/channels/googlechat/serviceAccount" }
      audienceType: "app-url",
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890", // optional; helps mention detection
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
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Observações:

- Credenciais de conta de serviço também podem ser passadas inline com `serviceAccount` (string JSON).
- `serviceAccountRef` também é compatível (env/file SecretRef), incluindo refs por conta em `channels.googlechat.accounts.<id>.serviceAccountRef`.
- O caminho padrão do Webhook é `/googlechat` se `webhookPath` não estiver definido.
- `dangerouslyAllowNameMatching` reabilita a correspondência mutável de principal por email para listas de permissões (modo de compatibilidade de emergência).
- Reações estão disponíveis por meio da ferramenta `reactions` e de `channels action` quando `actions.reactions` está habilitado.
- Ações de mensagem expõem `send` para texto e `upload-file` para envios explícitos de anexos. `upload-file` aceita `media` / `filePath` / `path`, além de `message`, `filename` e direcionamento de thread opcionais.
- `typingIndicator` aceita `none`, `message` (padrão) e `reaction` (`reaction` exige OAuth de usuário).
- Anexos são baixados por meio da Chat API e armazenados no pipeline de mídia (tamanho limitado por `mediaMaxMb`).

Detalhes de referência de segredos: [Gerenciamento de segredos](/pt-BR/gateway/secrets).

## Solução de problemas

### 405 Método não permitido

Se o Google Cloud Logs Explorer mostrar erros como:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Isso significa que o manipulador do Webhook não está registrado. Causas comuns:

1. **Canal não configurado**: a seção `channels.googlechat` está ausente da sua configuração. Verifique com:

   ```bash
   openclaw config get channels.googlechat
   ```

   Se retornar "Caminho de configuração não encontrado", adicione a configuração (consulte [Destaques de configuração](#config-highlights)).

2. **Plugin não habilitado**: verifique o status do Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Se mostrar "desabilitado", adicione `plugins.entries.googlechat.enabled: true` à sua configuração.

3. **Gateway não reiniciado**: depois de adicionar a configuração, reinicie o Gateway:

   ```bash
   openclaw gateway restart
   ```

Verifique se o canal está em execução:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Outros problemas

- Verifique `openclaw channels status --probe` para erros de autenticação ou configuração de público ausente.
- Se nenhuma mensagem chegar, confirme a URL do Webhook do app do Chat + assinaturas de evento.
- Se o bloqueio por menção impedir respostas, defina `botUser` como o nome do recurso de usuário do app e verifique `requireMention`.
- Use `openclaw logs --follow` ao enviar uma mensagem de teste para ver se as solicitações chegam ao Gateway.

Documentos relacionados:

- [Configuração do Gateway](/pt-BR/gateway/configuration)
- [Segurança](/pt-BR/gateway/security)
- [Reações](/pt-BR/tools/reactions)

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Emparelhamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de emparelhamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção
