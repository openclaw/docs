---
read_when:
    - Trabalhando em recursos do canal Google Chat
summary: Status de suporte, recursos e configuração do app Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-04-24T05:41:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: eacc27c89fd563abab6214912687e0f15c80c7d3e652e9159bf8b43190b0886a
    source_path: channels/googlechat.md
    workflow: 15
---

Status: pronto para DMs + spaces via Webhooks da API do Google Chat (somente HTTP).

## Configuração rápida (iniciante)

1. Crie um projeto no Google Cloud e ative a **Google Chat API**.
   - Acesse: [Google Chat API Credentials](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Ative a API se ela ainda não estiver ativada.
2. Crie uma **Service Account**:
   - Clique em **Create Credentials** > **Service Account**.
   - Dê o nome que quiser (por exemplo, `openclaw-chat`).
   - Deixe as permissões em branco (clique em **Continue**).
   - Deixe os principals com acesso em branco (clique em **Done**).
3. Crie e baixe a **JSON Key**:
   - Na lista de service accounts, clique na que você acabou de criar.
   - Vá para a aba **Keys**.
   - Clique em **Add Key** > **Create new key**.
   - Selecione **JSON** e clique em **Create**.
4. Armazene o arquivo JSON baixado no host do seu gateway (por exemplo, `~/.openclaw/googlechat-service-account.json`).
5. Crie um app do Google Chat em [Google Cloud Console Chat Configuration](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Preencha as **Application info**:
     - **App name**: (por exemplo, `OpenClaw`)
     - **Avatar URL**: (por exemplo, `https://openclaw.ai/logo.png`)
     - **Description**: (por exemplo, `Assistente pessoal com IA`)
   - Ative **Interactive features**.
   - Em **Functionality**, marque **Join spaces and group conversations**.
   - Em **Connection settings**, selecione **HTTP endpoint URL**.
   - Em **Triggers**, selecione **Use a common HTTP endpoint URL for all triggers** e defina como a URL pública do seu gateway seguida de `/googlechat`.
     - _Dica: Execute `openclaw status` para encontrar a URL pública do seu gateway._
   - Em **Visibility**, marque **Make this Chat app available to specific people and groups in `<Your Domain>`**.
   - Digite seu endereço de e-mail (por exemplo, `user@example.com`) na caixa de texto.
   - Clique em **Save** no final da página.
6. **Ative o status do app**:
   - Depois de salvar, **atualize a página**.
   - Procure a seção **App status** (geralmente perto do topo ou do final depois de salvar).
   - Altere o status para **Live - available to users**.
   - Clique em **Save** novamente.
7. Configure o OpenClaw com o caminho da service account + audience do Webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Ou config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Defina o tipo + valor de audience do Webhook (deve corresponder à configuração do seu app no Chat).
9. Inicie o gateway. O Google Chat fará POST para o caminho do seu Webhook.

## Adicionar ao Google Chat

Quando o gateway estiver em execução e seu e-mail tiver sido adicionado à lista de visibilidade:

1. Acesse [Google Chat](https://chat.google.com/).
2. Clique no ícone **+** (mais) ao lado de **Direct Messages**.
3. Na barra de pesquisa (onde você normalmente adiciona pessoas), digite o **App name** que você configurou no Google Cloud Console.
   - **Observação**: o bot _não_ aparecerá na lista de navegação do "Marketplace" porque é um app privado. Você deve procurá-lo pelo nome.
4. Selecione seu bot nos resultados.
5. Clique em **Add** ou **Chat** para iniciar uma conversa 1:1.
6. Envie "Hello" para acionar o assistente!

## URL pública (somente Webhook)

Os Webhooks do Google Chat exigem um endpoint HTTPS público. Para segurança, **exponha somente o caminho `/googlechat`** à internet. Mantenha o dashboard do OpenClaw e outros endpoints sensíveis na sua rede privada.

### Opção A: Tailscale Funnel (recomendado)

Use Tailscale Serve para o dashboard privado e Funnel para o caminho público do Webhook. Isso mantém `/` privado enquanto expõe apenas `/googlechat`.

1. **Verifique em qual endereço seu gateway está vinculado:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Anote o endereço IP (por exemplo, `127.0.0.1`, `0.0.0.0` ou seu IP do Tailscale, como `100.x.x.x`).

2. **Exponha o dashboard somente para a tailnet (porta 8443):**

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

4. **Autorize o Node para acesso ao Funnel:**
   Se solicitado, visite a URL de autorização mostrada na saída para ativar o Funnel para esse Node na política da sua tailnet.

5. **Verifique a configuração:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Sua URL pública do Webhook será:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Seu dashboard privado continuará restrito à tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Use a URL pública (sem `:8443`) na configuração do app do Google Chat.

> Observação: essa configuração persiste após reinicializações. Para removê-la depois, execute `tailscale funnel reset` e `tailscale serve reset`.

### Opção B: Proxy reverso (Caddy)

Se você usar um proxy reverso como o Caddy, faça proxy apenas do caminho específico:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Com essa configuração, qualquer solicitação para `your-domain.com/` será ignorada ou retornará 404, enquanto `your-domain.com/googlechat` será roteado com segurança para o OpenClaw.

### Opção C: Cloudflare Tunnel

Configure as regras de ingress do seu tunnel para rotear apenas o caminho do Webhook:

- **Path**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Default Rule**: HTTP 404 (Not Found)

## Como funciona

1. O Google Chat envia POSTs de Webhook para o gateway. Cada solicitação inclui um cabeçalho `Authorization: Bearer <token>`.
   - O OpenClaw verifica a autenticação bearer antes de ler/analisar corpos completos de Webhook quando o cabeçalho está presente.
   - Solicitações do Google Workspace Add-on que trazem `authorizationEventObject.systemIdToken` no corpo são compatíveis por meio de um orçamento de corpo de pré-autenticação mais restrito.
2. O OpenClaw verifica o token com base em `audienceType` + `audience` configurados:
   - `audienceType: "app-url"` → a audience é a URL HTTPS do seu Webhook.
   - `audienceType: "project-number"` → a audience é o número do projeto no Cloud.
3. As mensagens são roteadas por space:
   - DMs usam a chave de sessão `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Spaces usam a chave de sessão `agent:<agentId>:googlechat:group:<spaceId>`.
4. O acesso por DM usa pairing por padrão. Remetentes desconhecidos recebem um código de pairing; aprove com:
   - `openclaw pairing approve googlechat <code>`
5. Spaces de grupo exigem @-mention por padrão. Use `botUser` se a detecção de menção precisar do nome de usuário do app.

## Destinos

Use estes identificadores para entrega e listas de permissão:

- Mensagens diretas: `users/<userId>` (recomendado).
- E-mail bruto `name@example.com` é mutável e só é usado para correspondência direta em lista de permissão quando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsoleto: `users/<email>` é tratado como um ID de usuário, não como uma lista de permissão por e-mail.
- Spaces: `spaces/<spaceId>`.

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
          allow: true,
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

- As credenciais da service account também podem ser fornecidas inline com `serviceAccount` (string JSON).
- `serviceAccountRef` também é compatível (SecretRef de env/arquivo), incluindo refs por conta em `channels.googlechat.accounts.<id>.serviceAccountRef`.
- O caminho padrão do Webhook é `/googlechat` se `webhookPath` não for definido.
- `dangerouslyAllowNameMatching` reativa a correspondência por principal de e-mail mutável para listas de permissão (modo de compatibilidade break-glass).
- Reações estão disponíveis por meio da ferramenta `reactions` e de `channels action` quando `actions.reactions` está ativado.
- As ações de mensagem expõem `send` para texto e `upload-file` para envios explícitos de anexos. `upload-file` aceita `media` / `filePath` / `path`, além de `message`, `filename` e direcionamento de thread opcionais.
- `typingIndicator` oferece suporte a `none`, `message` (padrão) e `reaction` (reaction exige OAuth de usuário).
- Os anexos são baixados pela API do Chat e armazenados no pipeline de mídia (com tamanho limitado por `mediaMaxMb`).

Detalhes da referência de segredos: [Gerenciamento de segredos](/pt-BR/gateway/secrets).

## Solução de problemas

### 405 Method Not Allowed

Se o Google Cloud Logs Explorer mostrar erros como:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Isso significa que o manipulador de Webhook não está registrado. Causas comuns:

1. **Canal não configurado**: a seção `channels.googlechat` está ausente da sua configuração. Verifique com:

   ```bash
   openclaw config get channels.googlechat
   ```

   Se retornar "Config path not found", adicione a configuração (consulte [Destaques de configuração](#config-highlights)).

2. **Plugin não ativado**: verifique o status do Plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Se aparecer "disabled", adicione `plugins.entries.googlechat.enabled: true` à sua configuração.

3. **Gateway não reiniciado**: depois de adicionar a configuração, reinicie o gateway:

   ```bash
   openclaw gateway restart
   ```

Verifique se o canal está em execução:

```bash
openclaw channels status
# Should show: Google Chat default: enabled, configured, ...
```

### Outros problemas

- Verifique `openclaw channels status --probe` para erros de autenticação ou ausência de configuração de audience.
- Se nenhuma mensagem chegar, confirme a URL do Webhook + as assinaturas de eventos do app do Chat.
- Se a restrição por menção bloquear respostas, defina `botUser` como o nome do recurso de usuário do app e verifique `requireMention`.
- Use `openclaw logs --follow` enquanto envia uma mensagem de teste para ver se as solicitações chegam ao gateway.

Documentação relacionada:

- [Configuração do gateway](/pt-BR/gateway/configuration)
- [Segurança](/pt-BR/gateway/security)
- [Reações](/pt-BR/tools/reactions)

## Relacionado

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pairing
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e restrição por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
