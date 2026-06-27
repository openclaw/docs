---
read_when:
    - Trabalhando em recursos do canal Google Chat
summary: Status de suporte, recursos e configuração do app do Google Chat
title: Google Chat
x-i18n:
    generated_at: "2026-06-27T17:09:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3d506f6e92bfb73940254ca906c7581f24ac49d3f498fcae213eae71c4449442
    source_path: channels/googlechat.md
    workflow: 16
---

Status: plugin baixável para DMs + espaços via webhooks da API do Google Chat (somente HTTP).

## Instalação

Instale o Google Chat antes de configurar o canal:

```bash
openclaw plugins install @openclaw/googlechat
```

Checkout local (ao executar de um repositório git):

```bash
openclaw plugins install ./path/to/local/googlechat-plugin
```

## Configuração rápida (iniciante)

1. Crie um projeto do Google Cloud e ative a **API Google Chat**.
   - Acesse: [Credenciais da API Google Chat](https://console.cloud.google.com/apis/api/chat.googleapis.com/credentials)
   - Ative a API se ela ainda não estiver ativada.
2. Crie uma **Conta de serviço**:
   - Pressione **Criar credenciais** > **Conta de serviço**.
   - Dê o nome que quiser (por exemplo, `openclaw-chat`).
   - Deixe as permissões em branco (pressione **Continuar**).
   - Deixe os principais com acesso em branco (pressione **Concluído**).
3. Crie e baixe a **Chave JSON**:
   - Na lista de contas de serviço, clique naquela que você acabou de criar.
   - Acesse a aba **Chaves**.
   - Clique em **Adicionar chave** > **Criar nova chave**.
   - Selecione **JSON** e pressione **Criar**.
4. Armazene o arquivo JSON baixado no host do seu gateway (por exemplo, `~/.openclaw/googlechat-service-account.json`).
5. Crie um app do Google Chat na [Configuração do Chat no Console do Google Cloud](https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat):
   - Preencha as **Informações do aplicativo**:
     - **Nome do app**: (por exemplo, `OpenClaw`)
     - **URL do avatar**: (por exemplo, `https://openclaw.ai/logo.png`)
     - **Descrição**: (por exemplo, `Personal AI Assistant`)
   - Ative **Recursos interativos**.
   - Em **Funcionalidade**, marque **Participar de espaços e conversas em grupo**.
   - Em **Configurações de conexão**, selecione **URL do endpoint HTTP**.
   - Em **Gatilhos**, selecione **Usar uma URL de endpoint HTTP comum para todos os gatilhos** e defina-a como a URL pública do seu gateway seguida de `/googlechat`.
     - _Dica: execute `openclaw status` para encontrar a URL pública do seu gateway._
   - Em **Visibilidade**, marque **Disponibilizar este app do Chat para pessoas e grupos específicos em `<Your Domain>`**.
   - Insira seu endereço de e-mail (por exemplo, `user@example.com`) na caixa de texto.
   - Clique em **Salvar** na parte inferior.
6. **Ative o status do app**:
   - Depois de salvar, **atualize a página**.
   - Procure a seção **Status do app** (geralmente perto do topo ou da parte inferior depois de salvar).
   - Altere o status para **Ao vivo - disponível para usuários**.
   - Clique em **Salvar** novamente.
7. Configure o OpenClaw com o caminho da conta de serviço + público do webhook:
   - Env: `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE=/path/to/service-account.json`
   - Ou config: `channels.googlechat.serviceAccountFile: "/path/to/service-account.json"`.
8. Defina o tipo + valor do público do webhook (corresponde à configuração do seu app do Chat).
9. Inicie o gateway. O Google Chat enviará POST para o caminho do seu webhook.

## Adicionar ao Google Chat

Depois que o gateway estiver em execução e seu e-mail for adicionado à lista de visibilidade:

1. Acesse [Google Chat](https://chat.google.com/).
2. Clique no ícone **+** (mais) ao lado de **Mensagens diretas**.
3. Na barra de pesquisa (onde você normalmente adiciona pessoas), digite o **Nome do app** que configurou no Console do Google Cloud.
   - **Observação**: o bot _não_ aparecerá na lista de navegação do "Marketplace" porque é um app privado. Você deve pesquisá-lo pelo nome.
4. Selecione seu bot nos resultados.
5. Clique em **Adicionar** ou **Chat** para iniciar uma conversa 1:1.
6. Envie "Olá" para acionar o assistente!

## URL pública (somente Webhook)

Webhooks do Google Chat exigem um endpoint HTTPS público. Por segurança, **exponha somente o caminho `/googlechat`** à internet. Mantenha o painel do OpenClaw e outros endpoints sensíveis na sua rede privada.

### Opção A: Tailscale Funnel (Recomendado)

Use Tailscale Serve para o painel privado e Funnel para o caminho público do webhook. Isso mantém `/` privado enquanto expõe somente `/googlechat`.

1. **Verifique a qual endereço seu gateway está vinculado:**

   ```bash
   ss -tlnp | grep 18789
   ```

   Observe o endereço IP (por exemplo, `127.0.0.1`, `0.0.0.0` ou seu IP do Tailscale, como `100.x.x.x`).

2. **Exponha o painel somente para a tailnet (porta 8443):**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale serve --bg --https 8443 http://127.0.0.1:18789

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale serve --bg --https 8443 http://100.106.161.80:18789
   ```

3. **Exponha publicamente somente o caminho do webhook:**

   ```bash
   # If bound to localhost (127.0.0.1 or 0.0.0.0):
   tailscale funnel --bg --set-path /googlechat http://127.0.0.1:18789/googlechat

   # If bound to Tailscale IP only (e.g., 100.106.161.80):
   tailscale funnel --bg --set-path /googlechat http://100.106.161.80:18789/googlechat
   ```

4. **Autorize o node para acesso ao Funnel:**
   Se solicitado, visite a URL de autorização exibida na saída para ativar o Funnel para este node na sua política de tailnet.

5. **Verifique a configuração:**

   ```bash
   tailscale serve status
   tailscale funnel status
   ```

Sua URL pública do webhook será:
`https://<node-name>.<tailnet>.ts.net/googlechat`

Seu painel privado permanece somente na tailnet:
`https://<node-name>.<tailnet>.ts.net:8443/`

Use a URL pública (sem `:8443`) na configuração do app do Google Chat.

> Observação: esta configuração persiste entre reinicializações. Para removê-la depois, execute `tailscale funnel reset` e `tailscale serve reset`.

### Opção B: Proxy reverso (Caddy)

Se você usa um proxy reverso como o Caddy, faça proxy somente do caminho específico:

```caddy
your-domain.com {
    reverse_proxy /googlechat* localhost:18789
}
```

Com esta configuração, qualquer solicitação para `your-domain.com/` será ignorada ou retornará 404, enquanto `your-domain.com/googlechat` será roteado com segurança para o OpenClaw.

### Opção C: Cloudflare Tunnel

Configure as regras de ingresso do seu túnel para rotear somente o caminho do webhook:

- **Caminho**: `/googlechat` -> `http://localhost:18789/googlechat`
- **Regra padrão**: HTTP 404 (Não encontrado)

## Como funciona

1. O Google Chat envia POSTs de webhook para o gateway. Cada solicitação inclui um cabeçalho `Authorization: Bearer <token>`.
   - O OpenClaw verifica a autenticação bearer antes de ler/analisar os corpos completos dos webhooks quando o cabeçalho está presente.
   - Solicitações de complementos do Google Workspace que carregam `authorizationEventObject.systemIdToken` no corpo são compatíveis por meio de um orçamento de corpo de pré-autenticação mais restrito.
2. O OpenClaw verifica o token em relação ao `audienceType` + `audience` configurados:
   - `audienceType: "app-url"` → o público é a URL HTTPS do seu webhook.
   - `audienceType: "project-number"` → o público é o número do projeto do Cloud.
3. As mensagens são roteadas por espaço:
   - DMs usam a chave de sessão `agent:<agentId>:googlechat:direct:<spaceId>`.
   - Espaços usam a chave de sessão `agent:<agentId>:googlechat:group:<spaceId>`.
4. O acesso por DM usa pareamento por padrão. Remetentes desconhecidos recebem um código de pareamento; aprove com:
   - `openclaw pairing approve googlechat <code>`
5. Espaços de grupo exigem @menção por padrão. Use `botUser` se a detecção de menção precisar do nome de usuário do app.
6. Quando uma solicitação de aprovação de execução ou plugin começa no Google Chat e um aprovador estável `users/<id>` está configurado, o OpenClaw publica um cartão de aprovação nativo do Google Chat no espaço ou thread de origem. Os botões do cartão usam tokens de callback opacos, e o prompt manual `/approve <id> <decision>` só é exibido quando a entrega de aprovação nativa não está disponível.

## Destinos

Use estes identificadores para entrega e listas de permissão:

- Mensagens diretas: `users/<userId>` (recomendado).
- E-mail bruto `name@example.com` é mutável e usado somente para correspondência direta de lista de permissão quando `channels.googlechat.dangerouslyAllowNameMatching: true`.
- Obsoleto: `users/<email>` é tratado como um ID de usuário, não como uma lista de permissão de e-mail.
- Espaços: `spaces/<spaceId>`.

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
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

Observações:

- As credenciais da conta de serviço também podem ser passadas inline com `serviceAccount` (string JSON).
- `serviceAccountRef` também é compatível (env/file SecretRef), incluindo refs por conta em `channels.googlechat.accounts.<id>.serviceAccountRef`.
- O caminho padrão do webhook é `/googlechat` se `webhookPath` não estiver definido.
- `dangerouslyAllowNameMatching` reativa a correspondência de principal de e-mail mutável para listas de permissão (modo de compatibilidade de emergência).
- Reações estão disponíveis por meio da ferramenta `reactions` e de `channels action` quando `actions.reactions` está ativado.
- Cartões de aprovação nativos usam cliques em botões `cardsV2` do Google Chat, não eventos de reação. Aprovadores vêm de `dm.allowFrom` ou `defaultTo` e devem ser valores numéricos estáveis `users/<id>`.
- Ações de mensagem expõem `send` para texto e `upload-file` para envios explícitos de anexos. `upload-file` aceita `media` / `filePath` / `path`, além de `message`, `filename` e direcionamento de thread opcionais.
- `typingIndicator` é compatível com `message` (padrão), `none` e `reaction` (`reaction` exige OAuth de usuário).
- Anexos são baixados pela API Chat e armazenados no pipeline de mídia (tamanho limitado por `mediaMaxMb`).
- Mensagens do Google Chat criadas por bots são ignoradas por padrão. Se você definir intencionalmente `allowBots: true`, mensagens criadas por bots aceitas usam a [proteção compartilhada contra loop de bot](/pt-BR/channels/bot-loop-protection). Configure `channels.defaults.botLoopProtection` e então substitua por `channels.googlechat.botLoopProtection` ou `channels.googlechat.groups.<space>.botLoopProtection` quando um espaço precisar de um orçamento diferente.

Detalhes de referência de segredos: [Gerenciamento de segredos](/pt-BR/gateway/secrets).

## Solução de problemas

### 405 Método não permitido

Se o Explorador de registros do Google Cloud mostrar erros como:

```
status code: 405, reason phrase: HTTP error response: HTTP/1.1 405 Method Not Allowed
```

Isso significa que o manipulador do webhook não está registrado. Causas comuns:

1. **Canal não configurado**: a seção `channels.googlechat` está ausente da sua configuração. Verifique com:

   ```bash
   openclaw config get channels.googlechat
   ```

   Se retornar "Caminho de configuração não encontrado", adicione a configuração (consulte [Destaques da configuração](#config-highlights)).

2. **Plugin não ativado**: verifique o status do plugin:

   ```bash
   openclaw plugins list | grep googlechat
   ```

   Se mostrar "desativado", adicione `plugins.entries.googlechat.enabled: true` à sua configuração.

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

- Verifique `openclaw channels status --probe` para erros de autenticação ou configuração de público ausente.
- Se nenhuma mensagem chegar, confirme a URL do webhook + assinaturas de eventos do app do Chat.
- Se a exigência de menção bloquear respostas, defina `botUser` como o nome do recurso de usuário do app e verifique `requireMention`.
- Use `openclaw logs --follow` ao enviar uma mensagem de teste para ver se as solicitações chegam ao gateway.

Documentos relacionados:

- [Configuração do Gateway](/pt-BR/gateway/configuration)
- [Segurança](/pt-BR/gateway/security)
- [Reações](/pt-BR/tools/reactions)

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
