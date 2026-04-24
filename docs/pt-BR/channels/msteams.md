---
read_when:
    - Trabalhando em recursos do canal do Microsoft Teams
summary: Status do suporte ao bot do Microsoft Teams, capacidades e configuração
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-24T05:42:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: ba01e831382d31a3787b94d1c882d911c91c0f43d2aff84fd4ac5041423a08ac
    source_path: channels/msteams.md
    workflow: 15
---

Anexos em texto e em DMs são compatíveis; o envio de arquivos em canais e grupos exige `sharePointSiteId` + permissões do Graph (consulte [Enviando arquivos em chats em grupo](#sending-files-in-group-chats)). Enquetes são enviadas via Adaptive Cards. As ações de mensagem expõem `upload-file` explícito para envios com arquivo primeiro.

## Plugin incluído

O Microsoft Teams é fornecido como um Plugin incluído nas versões atuais do OpenClaw, portanto não é necessária uma instalação separada na build empacotada normal.

Se você estiver em uma build mais antiga ou em uma instalação personalizada que exclua o Teams incluído, instale-o manualmente:

```bash
openclaw plugins install @openclaw/msteams
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida (iniciante)

1. Verifique se o Plugin do Microsoft Teams está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie um **Azure Bot** (App ID + segredo do cliente + tenant ID).
3. Configure o OpenClaw com essas credenciais.
4. Exponha `/api/messages` (porta 3978 por padrão) por meio de uma URL pública ou tunnel.
5. Instale o pacote do app do Teams e inicie o gateway.

Configuração mínima (segredo do cliente):

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      appPassword: "<APP_PASSWORD>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Para implantações em produção, considere usar [autenticação federada](#federated-authentication) (certificado ou managed identity) em vez de segredos do cliente.

Observação: chats em grupo são bloqueados por padrão (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respostas em grupo, defina `channels.msteams.groupAllowFrom` (ou use `groupPolicy: "open"` para permitir qualquer membro, com exigência de menção).

## Escritas de configuração

Por padrão, o Microsoft Teams pode gravar atualizações de configuração acionadas por `/config set|unset` (exige `commands.config: true`).

Desative com:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Controle de acesso (DMs + grupos)

**Acesso por DM**

- Padrão: `channels.msteams.dmPolicy = "pairing"`. Remetentes desconhecidos são ignorados até serem aprovados.
- `channels.msteams.allowFrom` deve usar IDs estáveis de objeto AAD.
- Não dependa de correspondência por UPN/nome de exibição para allowlists — eles podem mudar. O OpenClaw desativa a correspondência direta por nome por padrão; habilite explicitamente com `channels.msteams.dangerouslyAllowNameMatching: true`.
- O assistente pode resolver nomes para IDs via Microsoft Graph quando as credenciais permitirem.

**Acesso por grupo**

- Padrão: `channels.msteams.groupPolicy = "allowlist"` (bloqueado a menos que você adicione `groupAllowFrom`). Use `channels.defaults.groupPolicy` para substituir o padrão quando não estiver definido.
- `channels.msteams.groupAllowFrom` controla quais remetentes podem acionar em chats/canais de grupo (usa `channels.msteams.allowFrom` como fallback).
- Defina `groupPolicy: "open"` para permitir qualquer membro (ainda com exigência de menção por padrão).
- Para não permitir **nenhum canal**, defina `channels.msteams.groupPolicy: "disabled"`.

Exemplo:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["user@org.com"],
    },
  },
}
```

**Teams + allowlist de canal**

- Restrinja respostas em grupo/canal listando equipes e canais em `channels.msteams.teams`.
- As chaves devem usar IDs estáveis de equipe e IDs de conversa de canal.
- Quando `groupPolicy="allowlist"` e uma allowlist de equipes estiver presente, apenas as equipes/canais listados serão aceitos (com exigência de menção).
- O assistente de configuração aceita entradas `Team/Channel` e as armazena para você.
- Na inicialização, o OpenClaw resolve nomes de equipe/canal e nomes da allowlist de usuários para IDs (quando as permissões do Graph permitem)
  e registra o mapeamento em log; nomes de equipe/canal não resolvidos são mantidos como digitados, mas ignorados no roteamento por padrão, a menos que `channels.msteams.dangerouslyAllowNameMatching: true` esteja habilitado.

Exemplo:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      teams: {
        "My Team": {
          channels: {
            General: { requireMention: true },
          },
        },
      },
    },
  },
}
```

## Configuração do Azure Bot

Antes de configurar o OpenClaw, crie um recurso Azure Bot e capture suas credenciais.

<Steps>
  <Step title="Criar o Azure Bot">
    Vá para [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot) e preencha a aba **Basics**:

    | Campo              | Valor                                                    |
    | ------------------ | -------------------------------------------------------- |
    | **Bot handle**     | O nome do seu bot, por exemplo `openclaw-msteams` (deve ser único)  |
    | **Subscription**   | Sua assinatura do Azure                                  |
    | **Resource group** | Crie um novo ou use um existente                         |
    | **Pricing tier**   | **Free** para desenvolvimento/testes                     |
    | **Type of App**    | **Single Tenant** (recomendado)                          |
    | **Creation type**  | **Create new Microsoft App ID**                          |

    <Note>
    Novos bots multi-tenant foram descontinuados após 2025-07-31. Use **Single Tenant** para novos bots.
    </Note>

    Clique em **Review + create** → **Create** (aguarde ~1-2 minutos).

  </Step>

  <Step title="Capturar credenciais">
    No recurso Azure Bot → **Configuration**:

    - copie **Microsoft App ID** → `appId`
    - **Manage Password** → **Certificates & secrets** → **New client secret** → copie o valor → `appPassword`
    - **Overview** → **Directory (tenant) ID** → `tenantId`

  </Step>

  <Step title="Configurar endpoint de mensagens">
    Azure Bot → **Configuration** → defina **Messaging endpoint**:

    - Produção: `https://your-domain.com/api/messages`
    - Desenvolvimento local: use um tunnel (consulte [Desenvolvimento local](#local-development-tunneling))

  </Step>

  <Step title="Habilitar o canal do Teams">
    Azure Bot → **Channels** → clique em **Microsoft Teams** → Configure → Save. Aceite os Terms of Service.
  </Step>
</Steps>

## Autenticação federada

> Adicionado na versão 2026.3.24

Para implantações em produção, o OpenClaw oferece suporte à **autenticação federada** como uma alternativa mais segura aos segredos do cliente. Há dois métodos disponíveis:

### Opção A: autenticação baseada em certificado

Use um certificado PEM registrado no registro do seu app do Entra ID.

**Configuração:**

1. Gere ou obtenha um certificado (formato PEM com chave privada).
2. Em Entra ID → App Registration → **Certificates & secrets** → **Certificates** → faça upload do certificado público.

**Configuração:**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      certificatePath: "/path/to/cert.pem",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Variáveis de ambiente:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_CERTIFICATE_PATH=/path/to/cert.pem`

### Opção B: Azure Managed Identity

Use Azure Managed Identity para autenticação sem senha. Isso é ideal para implantações em infraestrutura Azure (AKS, App Service, VMs do Azure) onde uma managed identity está disponível.

**Como funciona:**

1. O pod/VM do bot tem uma managed identity (atribuída pelo sistema ou pelo usuário).
2. Uma **federated identity credential** vincula a managed identity ao registro do app do Entra ID.
3. Em tempo de execução, o OpenClaw usa `@azure/identity` para obter tokens do endpoint Azure IMDS (`169.254.169.254`).
4. O token é passado ao SDK do Teams para autenticação do bot.

**Pré-requisitos:**

- Infraestrutura Azure com managed identity habilitada (AKS workload identity, App Service, VM)
- Federated identity credential criada no registro do app do Entra ID
- Acesso de rede ao IMDS (`169.254.169.254:80`) a partir do pod/VM

**Configuração (managed identity atribuída pelo sistema):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Configuração (managed identity atribuída pelo usuário):**

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<APP_ID>",
      tenantId: "<TENANT_ID>",
      authType: "federated",
      useManagedIdentity: true,
      managedIdentityClientId: "<MI_CLIENT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

**Variáveis de ambiente:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (apenas para atribuída pelo usuário)

### Configuração de AKS workload identity

Para implantações em AKS usando workload identity:

1. **Habilite workload identity** no seu cluster AKS.
2. **Crie uma federated identity credential** no registro do app do Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Anote a service account do Kubernetes** com o client ID do app:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Rotule o pod** para injeção de workload identity:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Garanta acesso de rede** ao IMDS (`169.254.169.254`) — se estiver usando NetworkPolicy, adicione uma regra de saída permitindo tráfego para `169.254.169.254/32` na porta 80.

### Comparação de tipos de autenticação

| Método               | Configuração                                    | Prós                               | Contras                                 |
| -------------------- | ----------------------------------------------- | ---------------------------------- | --------------------------------------- |
| **Client secret**    | `appPassword`                                   | Configuração simples               | Rotação de segredo necessária, menos seguro |
| **Certificate**      | `authType: "federated"` + `certificatePath`     | Sem segredo compartilhado na rede  | Sobrecarga de gerenciamento de certificado |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity`  | Sem senha, sem segredos para gerenciar | Infraestrutura Azure obrigatória     |

**Comportamento padrão:** quando `authType` não está definido, o OpenClaw usa autenticação por segredo do cliente por padrão. Configurações existentes continuam funcionando sem mudanças.

## Desenvolvimento local (tunneling)

O Teams não consegue acessar `localhost`. Use um tunnel para desenvolvimento local:

**Opção A: ngrok**

```bash
ngrok http 3978
# Copie a URL https, por exemplo, https://abc123.ngrok.io
# Defina o endpoint de mensagens como: https://abc123.ngrok.io/api/messages
```

**Opção B: Tailscale Funnel**

```bash
tailscale funnel 3978
# Use sua URL do Tailscale funnel como endpoint de mensagens
```

## Teams Developer Portal (alternativa)

Em vez de criar manualmente um ZIP de manifesto, você pode usar o [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Clique em **+ New app**
2. Preencha as informações básicas (nome, descrição, informações do desenvolvedor)
3. Vá para **App features** → **Bot**
4. Selecione **Enter a bot ID manually** e cole seu Azure Bot App ID
5. Marque os escopos: **Personal**, **Team**, **Group Chat**
6. Clique em **Distribute** → **Download app package**
7. No Teams: **Apps** → **Manage your apps** → **Upload a custom app** → selecione o ZIP

Isso costuma ser mais fácil do que editar manifestos JSON manualmente.

## Testando o bot

**Opção A: Azure Web Chat (verifique o webhook primeiro)**

1. No Azure Portal → seu recurso Azure Bot → **Test in Web Chat**
2. Envie uma mensagem - você deve ver uma resposta
3. Isso confirma que seu endpoint de webhook funciona antes da configuração do Teams

**Opção B: Teams (após a instalação do app)**

1. Instale o app do Teams (sideload ou catálogo da organização)
2. Encontre o bot no Teams e envie uma DM
3. Verifique os logs do gateway para atividade recebida

<Accordion title="Substituições por variáveis de ambiente">

Qualquer uma das chaves de configuração do bot/autenticação também pode ser definida via variáveis de ambiente:

- `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (`"secret"` ou `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH`, `MSTEAMS_CERTIFICATE_THUMBPRINT` (federada + certificado)
- `MSTEAMS_USE_MANAGED_IDENTITY`, `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (federada + managed identity; client ID apenas para atribuída pelo usuário)

</Accordion>

## Ação de informações do membro

O OpenClaw expõe uma ação `member-info` com suporte do Graph para o Microsoft Teams, para que agentes e automações possam resolver detalhes de membros do canal (nome de exibição, email, função) diretamente do Microsoft Graph.

Requisitos:

- Permissão RSC `Member.Read.Group` (já está no manifesto recomendado)
- Para pesquisas entre equipes: permissão de aplicativo do Graph `User.Read.All` com consentimento de administrador

A ação é controlada por `channels.msteams.actions.memberInfo` (padrão: habilitada quando credenciais do Graph estão disponíveis).

## Contexto do histórico

- `channels.msteams.historyLimit` controla quantas mensagens recentes do canal/grupo são incluídas no prompt.
- Usa `messages.groupChat.historyLimit` como fallback. Defina `0` para desabilitar (padrão 50).
- O histórico de thread buscado é filtrado por allowlists de remetente (`allowFrom` / `groupAllowFrom`), então a semeadura de contexto da thread inclui apenas mensagens de remetentes permitidos.
- O contexto de anexo citado (`ReplyTo*` derivado do HTML de resposta do Teams) atualmente é passado como recebido.
- Em outras palavras, as allowlists controlam quem pode acionar o agente; hoje apenas caminhos específicos de contexto suplementar são filtrados.
- O histórico de DM pode ser limitado com `channels.msteams.dmHistoryLimit` (turnos do usuário). Substituições por usuário: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permissões RSC atuais do Teams

Estas são as **resourceSpecific permissions** existentes no manifesto do nosso app do Teams. Elas só se aplicam dentro da equipe/chat em que o app está instalado.

**Para canais (escopo da equipe):**

- `ChannelMessage.Read.Group` (Application) - receber todas as mensagens do canal sem @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Para chats em grupo:**

- `ChatMessage.Read.Chat` (Application) - receber todas as mensagens do chat em grupo sem @mention

## Exemplo de manifesto do Teams

Exemplo mínimo e válido com os campos obrigatórios. Substitua IDs e URLs.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Your Org",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw in Teams", full: "OpenClaw in Teams" },
  icons: { outline: "outline.png", color: "color.png" },
  accentColor: "#5B6DEF",
  bots: [
    {
      botId: "11111111-1111-1111-1111-111111111111",
      scopes: ["personal", "team", "groupChat"],
      isNotificationOnly: false,
      supportsCalling: false,
      supportsVideo: false,
      supportsFiles: true,
    },
  ],
  webApplicationInfo: {
    id: "11111111-1111-1111-1111-111111111111",
  },
  authorization: {
    permissions: {
      resourceSpecific: [
        { name: "ChannelMessage.Read.Group", type: "Application" },
        { name: "ChannelMessage.Send.Group", type: "Application" },
        { name: "Member.Read.Group", type: "Application" },
        { name: "Owner.Read.Group", type: "Application" },
        { name: "ChannelSettings.Read.Group", type: "Application" },
        { name: "TeamMember.Read.Group", type: "Application" },
        { name: "TeamSettings.Read.Group", type: "Application" },
        { name: "ChatMessage.Read.Chat", type: "Application" },
      ],
    },
  },
}
```

### Observações sobre o manifesto (campos obrigatórios)

- `bots[].botId` **deve** corresponder ao Azure Bot App ID.
- `webApplicationInfo.id` **deve** corresponder ao Azure Bot App ID.
- `bots[].scopes` deve incluir as superfícies que você pretende usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` é obrigatório para manipulação de arquivos no escopo pessoal.
- `authorization.permissions.resourceSpecific` deve incluir leitura/envio de canal se você quiser tráfego de canal.

### Atualizando um app existente

Para atualizar um app do Teams já instalado (por exemplo, para adicionar permissões RSC):

1. Atualize seu `manifest.json` com as novas configurações
2. **Incremente o campo `version`** (por exemplo, `1.0.0` → `1.1.0`)
3. **Compacte novamente em zip** o manifesto com os ícones (`manifest.json`, `outline.png`, `color.png`)
4. Faça upload do novo zip:
   - **Opção A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → encontre seu app → Upload new version
   - **Opção B (Sideload):** No Teams → Apps → Manage your apps → Upload a custom app
5. **Para canais de equipe:** reinstale o app em cada equipe para que as novas permissões tenham efeito
6. **Feche completamente e reabra o Teams** (não apenas feche a janela) para limpar os metadados de app em cache

## Capacidades: apenas RSC vs Graph

### Apenas Teams RSC (sem permissões da API do Graph)

Funciona:

- Ler conteúdo de **texto** de mensagens de canal.
- Enviar conteúdo de **texto** de mensagens de canal.
- Receber anexos de arquivo em **escopo pessoal (DM)**.

NÃO funciona:

- **Imagens ou conteúdo de arquivos** de canal/grupo (a carga inclui apenas stub HTML).
- Download de anexos armazenados no SharePoint/OneDrive.
- Leitura do histórico de mensagens (além do evento de webhook ao vivo).

### Teams RSC mais permissões de aplicativo do Microsoft Graph

Adiciona:

- Download de conteúdos hospedados (imagens coladas em mensagens).
- Download de anexos de arquivo armazenados no SharePoint/OneDrive.
- Leitura do histórico de mensagens de canal/chat via Graph.

### RSC vs API do Graph

| Capacidade              | Permissões RSC       | API do Graph                         |
| ----------------------- | -------------------- | ------------------------------------ |
| **Mensagens em tempo real** | Sim (via webhook) | Não (apenas polling)                 |
| **Mensagens históricas** | Não                | Sim (pode consultar histórico)       |
| **Complexidade de configuração** | Apenas manifesto do app | Exige consentimento de administrador + fluxo de token |
| **Funciona offline**    | Não (precisa estar em execução) | Sim (consultar a qualquer momento) |

**Em resumo:** RSC é para escuta em tempo real; a API do Graph é para acesso histórico. Para recuperar mensagens perdidas enquanto estiver offline, você precisa da API do Graph com `ChannelMessage.Read.All` (exige consentimento de administrador).

## Mídia + histórico habilitados por Graph (obrigatório para canais)

Se você precisa de imagens/arquivos em **canais** ou quer buscar **histórico de mensagens**, precisa habilitar permissões do Microsoft Graph e conceder consentimento de administrador.

1. Em Entra ID (Azure AD) **App Registration**, adicione permissões de **Application** do Microsoft Graph:
   - `ChannelMessage.Read.All` (anexos de canal + histórico)
   - `Chat.Read.All` ou `ChatMessage.Read.All` (chats em grupo)
2. **Conceda consentimento de administrador** para o tenant.
3. Incremente a **versão do manifesto** do app do Teams, faça novo upload e **reinstale o app no Teams**.
4. **Feche completamente e reabra o Teams** para limpar os metadados de app em cache.

**Permissão adicional para menções de usuário:** menções com @usuário funcionam prontamente para usuários na conversa. No entanto, se você quiser pesquisar e mencionar dinamicamente usuários que **não estão na conversa atual**, adicione a permissão `User.Read.All` (Application) e conceda consentimento de administrador.

## Limitações conhecidas

### Timeouts de webhook

O Teams entrega mensagens via webhook HTTP. Se o processamento demorar muito (por exemplo, respostas lentas do LLM), você poderá ver:

- Timeouts do gateway
- O Teams tentando novamente a mensagem (causando duplicatas)
- Respostas descartadas

O OpenClaw lida com isso retornando rapidamente e enviando respostas proativamente, mas respostas muito lentas ainda podem causar problemas.

### Formatação

O markdown do Teams é mais limitado do que o do Slack ou Discord:

- A formatação básica funciona: **negrito**, _itálico_, `code`, links
- Markdown complexo (tabelas, listas aninhadas) pode não ser renderizado corretamente
- Adaptive Cards são compatíveis para enquetes e envios de apresentação semântica (consulte abaixo)

## Configuração

Configurações agrupadas (consulte `/gateway/configuration` para padrões compartilhados de canal).

<AccordionGroup>
  <Accordion title="Núcleo e webhook">
    - `channels.msteams.enabled`
    - `channels.msteams.appId`, `appPassword`, `tenantId`: credenciais do bot
    - `channels.msteams.webhook.port` (padrão `3978`)
    - `channels.msteams.webhook.path` (padrão `/api/messages`)
  </Accordion>

  <Accordion title="Autenticação">
    - `authType`: `"secret"` (padrão) ou `"federated"`
    - `certificatePath`, `certificateThumbprint`: autenticação federada + certificado (thumbprint opcional)
    - `useManagedIdentity`, `managedIdentityClientId`: autenticação federada + managed identity
  </Accordion>

  <Accordion title="Controle de acesso">
    - `dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing)
    - `allowFrom`: allowlist de DM, prefira IDs de objeto AAD; o assistente resolve nomes quando o acesso ao Graph está disponível
    - `dangerouslyAllowNameMatching`: opção de emergência para UPN/nome de exibição mutável e roteamento por nome de equipe/canal
    - `requireMention`: exigir @mention em canais/grupos (padrão `true`)
  </Accordion>

  <Accordion title="Substituições de equipe e canal">
    Todos estes substituem os padrões de nível superior:

    - `teams.<teamId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.tools`, `.toolsBySender`: política de ferramentas padrão por equipe
    - `teams.<teamId>.channels.<conversationId>.replyStyle`, `.requireMention`
    - `teams.<teamId>.channels.<conversationId>.tools`, `.toolsBySender`

    As chaves de `toolsBySender` aceitam prefixos `id:`, `e164:`, `username:`, `name:` (chaves sem prefixo são mapeadas para `id:`). `"*"` é um curinga.

  </Accordion>

  <Accordion title="Entrega, mídia e ações">
    - `textChunkLimit`: tamanho do chunk de texto de saída
    - `chunkMode`: `length` (padrão) ou `newline` (divide em limites de parágrafo antes do comprimento)
    - `mediaAllowHosts`: allowlist de host de anexos de entrada (por padrão, domínios Microsoft/Teams)
    - `mediaAuthAllowHosts`: hosts que podem receber cabeçalhos Authorization em tentativas novamente (por padrão, Graph + Bot Framework)
    - `replyStyle`: `thread | top-level` (consulte [Estilo de resposta](#reply-style-threads-vs-posts))
    - `actions.memberInfo`: alternar a ação de informações do membro com suporte do Graph (ativada por padrão quando o Graph está disponível)
    - `sharePointSiteId`: obrigatório para uploads de arquivo em chats/canais de grupo (consulte [Enviando arquivos em chats em grupo](#sending-files-in-group-chats))
  </Accordion>
</AccordionGroup>

## Roteamento e sessões

- As chaves de sessão seguem o formato padrão do agente (consulte [/concepts/session](/pt-BR/concepts/session)):
  - Mensagens diretas compartilham a sessão principal (`agent:<agentId>:<mainKey>`).
  - Mensagens de canal/grupo usam o ID da conversa:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de resposta: threads vs posts

O Teams introduziu recentemente dois estilos de interface de canal sobre o mesmo modelo de dados subjacente:

| Estilo                  | Descrição                                                | `replyStyle` recomendado |
| ----------------------- | -------------------------------------------------------- | ------------------------ |
| **Posts** (clássico)    | Mensagens aparecem como cartões com respostas em thread abaixo | `thread` (padrão)   |
| **Threads** (estilo Slack) | Mensagens fluem linearmente, mais parecido com o Slack | `top-level`              |

**O problema:** a API do Teams não expõe qual estilo de interface um canal usa. Se você usar o `replyStyle` errado:

- `thread` em um canal no estilo Threads → as respostas aparecem aninhadas de forma estranha
- `top-level` em um canal no estilo Posts → as respostas aparecem como posts separados de nível superior em vez de dentro da thread

**Solução:** configure `replyStyle` por canal com base em como o canal está configurado:

```json5
{
  channels: {
    msteams: {
      replyStyle: "thread",
      teams: {
        "19:abc...@thread.tacv2": {
          channels: {
            "19:xyz...@thread.tacv2": {
              replyStyle: "top-level",
            },
          },
        },
      },
    },
  },
}
```

## Anexos e imagens

**Limitações atuais:**

- **DMs:** imagens e anexos de arquivo funcionam via APIs de arquivo de bot do Teams.
- **Canais/grupos:** anexos ficam no armazenamento do M365 (SharePoint/OneDrive). A carga do webhook inclui apenas um stub HTML, não os bytes reais do arquivo. **Permissões da API do Graph são obrigatórias** para baixar anexos de canal.
- Para envios explícitos com arquivo primeiro, use `action=upload-file` com `media` / `filePath` / `path`; `message` opcional se torna o texto/comentário que acompanha, e `filename` substitui o nome enviado.

Sem permissões do Graph, mensagens de canal com imagens serão recebidas apenas como texto (o conteúdo da imagem não fica acessível ao bot).
Por padrão, o OpenClaw só baixa mídia de hostnames da Microsoft/Teams. Substitua com `channels.msteams.mediaAllowHosts` (use `["*"]` para permitir qualquer host).
Cabeçalhos Authorization só são anexados para hosts em `channels.msteams.mediaAuthAllowHosts` (por padrão, hosts do Graph + Bot Framework). Mantenha essa lista restrita (evite sufixos multi-tenant).

## Enviando arquivos em chats em grupo

Bots podem enviar arquivos em DMs usando o fluxo FileConsentCard (integrado). No entanto, **enviar arquivos em chats/canais de grupo** exige configuração adicional:

| Contexto                 | Como os arquivos são enviados               | Configuração necessária                         |
| ------------------------ | ------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → usuário aceita → bot envia | Funciona imediatamente                          |
| **Chats/canais de grupo** | Upload para o SharePoint → compartilhar link | Exige `sharePointSiteId` + permissões do Graph |
| **Imagens (qualquer contexto)** | Inline codificado em Base64          | Funciona imediatamente                          |

### Por que chats em grupo precisam de SharePoint

Bots não têm um drive pessoal no OneDrive (o endpoint da API do Graph `/me/drive` não funciona para identidades de aplicativo). Para enviar arquivos em chats/canais de grupo, o bot faz upload para um **site do SharePoint** e cria um link de compartilhamento.

### Configuração

1. **Adicione permissões da API do Graph** em Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - enviar arquivos para o SharePoint
   - `Chat.Read.All` (Application) - opcional, habilita links de compartilhamento por usuário

2. **Conceda consentimento de administrador** para o tenant.

3. **Obtenha o ID do seu site do SharePoint:**

   ```bash
   # Via Graph Explorer ou curl com um token válido:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Exemplo: para um site em "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # A resposta inclui: "id": "contoso.sharepoint.com,guid1,guid2"
   ```

4. **Configure o OpenClaw:**

   ```json5
   {
     channels: {
       msteams: {
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportamento de compartilhamento

| Permissão                              | Comportamento de compartilhamento                         |
| -------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` apenas           | Link de compartilhamento para toda a organização (qualquer pessoa na organização pode acessar) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link de compartilhamento por usuário (apenas membros do chat podem acessar) |

O compartilhamento por usuário é mais seguro, pois apenas os participantes do chat podem acessar o arquivo. Se a permissão `Chat.Read.All` estiver ausente, o bot usa como fallback o compartilhamento para toda a organização.

### Comportamento de fallback

| Cenário                                           | Resultado                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Chat em grupo + arquivo + `sharePointSiteId` configurado | Upload para o SharePoint, envio de link de compartilhamento |
| Chat em grupo + arquivo + sem `sharePointSiteId`  | Tenta upload para o OneDrive (pode falhar), envia apenas texto |
| Chat pessoal + arquivo                            | Fluxo FileConsentCard (funciona sem SharePoint)    |
| Qualquer contexto + imagem                        | Inline codificado em Base64 (funciona sem SharePoint) |

### Local onde os arquivos são armazenados

Os arquivos enviados são armazenados em uma pasta `/OpenClawShared/` na biblioteca de documentos padrão do site do SharePoint configurado.

## Enquetes (adaptive cards)

O OpenClaw envia enquetes do Teams como Adaptive Cards (não há uma API nativa de enquete no Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Os votos são registrados pelo gateway em `~/.openclaw/msteams-polls.json`.
- O gateway precisa permanecer online para registrar votos.
- As enquetes ainda não publicam automaticamente resumos de resultados (inspecione o arquivo de armazenamento, se necessário).

## Cartões de apresentação

Envie cargas de apresentação semântica para usuários ou conversas do Teams usando a ferramenta `message` ou a CLI. O OpenClaw as renderiza como Adaptive Cards do Teams a partir do contrato genérico de apresentação.

O parâmetro `presentation` aceita blocos semânticos. Quando `presentation` é fornecido, o texto da mensagem é opcional.

**Ferramenta do agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello!"}]}'
```

Para detalhes do formato de destino, consulte [Formatos de destino](#target-formats) abaixo.

## Formatos de destino

Os destinos do MSTeams usam prefixos para distinguir entre usuários e conversas:

| Tipo de destino         | Formato                         | Exemplo                                             |
| ----------------------- | ------------------------------- | --------------------------------------------------- |
| Usuário (por ID)        | `user:<aad-object-id>`          | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Usuário (por nome)      | `user:<display-name>`           | `user:John Smith` (exige API do Graph)              |
| Grupo/canal             | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Grupo/canal (bruto)     | `<conversation-id>`             | `19:abc123...@thread.tacv2` (se contiver `@thread`) |

**Exemplos de CLI:**

```bash
# Enviar para um usuário por ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Enviar para um usuário por nome de exibição (aciona pesquisa na API do Graph)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Enviar para um chat em grupo ou canal
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Enviar um cartão de apresentação para uma conversa
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Exemplos de ferramenta do agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Hello!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Hello",
    blocks: [{ type: "text", text: "Hello" }],
  },
}
```

Observação: sem o prefixo `user:`, os nomes usam por padrão a resolução de grupo/equipe. Sempre use `user:` ao direcionar pessoas por nome de exibição.

## Mensagens proativas

- Mensagens proativas só são possíveis **depois** que um usuário interagiu, porque armazenamos referências de conversa nesse momento.
- Consulte `/gateway/configuration` para `dmPolicy` e controle por allowlist.

## IDs de equipe e canal

O parâmetro de consulta `groupId` em URLs do Teams **NÃO** é o ID da equipe usado na configuração. Extraia os IDs do caminho da URL:

**URL da equipe:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID da equipe (faça URL-decode)
```

**URL do canal:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID do canal (faça URL-decode)
```

**Para configuração:**

- ID da equipe = segmento do caminho após `/team/` (decodificado da URL, por exemplo, `19:Bk4j...@thread.tacv2`)
- ID do canal = segmento do caminho após `/channel/` (decodificado da URL)
- **Ignore** o parâmetro de consulta `groupId`

## Canais privados

Bots têm suporte limitado em canais privados:

| Recurso                      | Canais padrão     | Canais privados        |
| ---------------------------- | ----------------- | ---------------------- |
| Instalação do bot            | Sim               | Limitado               |
| Mensagens em tempo real (webhook) | Sim         | Pode não funcionar     |
| Permissões RSC               | Sim               | Podem se comportar de forma diferente |
| @mentions                    | Sim               | Se o bot estiver acessível |
| Histórico via API do Graph   | Sim               | Sim (com permissões)   |

**Alternativas se canais privados não funcionarem:**

1. Use canais padrão para interações com o bot
2. Use DMs - os usuários sempre podem enviar mensagem ao bot diretamente
3. Use a API do Graph para acesso histórico (exige `ChannelMessage.Read.All`)

## Solução de problemas

### Problemas comuns

- **Imagens não aparecem em canais:** faltam permissões do Graph ou consentimento de administrador. Reinstale o app do Teams e feche/reabra completamente o Teams.
- **Sem respostas no canal:** menções são obrigatórias por padrão; defina `channels.msteams.requireMention=false` ou configure por equipe/canal.
- **Incompatibilidade de versão (o Teams ainda mostra o manifesto antigo):** remova + adicione novamente o app e feche completamente o Teams para atualizar.
- **401 Unauthorized do webhook:** esperado ao testar manualmente sem JWT do Azure - significa que o endpoint está acessível, mas a autenticação falhou. Use Azure Web Chat para testar corretamente.

### Erros de upload do manifesto

- **"Icon file cannot be empty":** o manifesto faz referência a arquivos de ícone com 0 bytes. Crie ícones PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** o app ainda está instalado em outra equipe/chat. Localize e desinstale primeiro, ou aguarde 5–10 minutos pela propagação.
- **"Something went wrong" no upload:** faça upload via [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), abra o DevTools do navegador (F12) → aba Network e verifique o corpo da resposta para ver o erro real.
- **Falha no sideload:** tente "Upload an app to your org's app catalog" em vez de "Upload a custom app" - isso geralmente contorna restrições de sideload.

### Permissões RSC não funcionam

1. Verifique se `webApplicationInfo.id` corresponde exatamente ao App ID do seu bot
2. Faça novo upload do app e reinstale no team/chat
3. Verifique se o administrador da sua organização bloqueou permissões RSC
4. Confirme que você está usando o escopo correto: `ChannelMessage.Read.Group` para equipes, `ChatMessage.Read.Chat` para chats em grupo

## Referências

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guia de configuração do Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - criar/gerenciar apps do Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo exige Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Relacionado

<CardGroup cols={2}>
  <Card title="Visão geral dos canais" icon="list" href="/pt-BR/channels">
    Todos os canais compatíveis.
  </Card>
  <Card title="Pairing" icon="link" href="/pt-BR/channels/pairing">
    Autenticação de DM e fluxo de pairing.
  </Card>
  <Card title="Grupos" icon="users" href="/pt-BR/channels/groups">
    Comportamento de chat em grupo e exigência de menção.
  </Card>
  <Card title="Roteamento de canal" icon="route" href="/pt-BR/channels/channel-routing">
    Roteamento de sessão para mensagens.
  </Card>
  <Card title="Segurança" icon="shield" href="/pt-BR/gateway/security">
    Modelo de acesso e endurecimento.
  </Card>
</CardGroup>
