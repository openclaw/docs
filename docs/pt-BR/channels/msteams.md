---
read_when:
    - Trabalhando em recursos do canal do Microsoft Teams
summary: Status do suporte do bot do Microsoft Teams, capacidades e configuração
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-22T04:19:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ee9d52fb2cc7801e84249a705e0fa2052d4afbb7ef58cee2d3362b3e7012348c
    source_path: channels/msteams.md
    workflow: 15
---

# Microsoft Teams

> "Abandonai toda a esperança, vós que entrais aqui."

Status: texto + anexos em DM são compatíveis; o envio de arquivos em canais/grupos requer `sharePointSiteId` + permissões do Graph (consulte [Envio de arquivos em chats de grupo](#sending-files-in-group-chats)). Enquetes são enviadas via Adaptive Cards. As ações de mensagem expõem `upload-file` explícito para envios com arquivo em primeiro lugar.

## Plugin incluído

O Microsoft Teams é fornecido como um plugin incluído nas versões atuais do OpenClaw, portanto
não é necessária uma instalação separada na compilação empacotada normal.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o Teams incluído,
instale-o manualmente:

```bash
openclaw plugins install @openclaw/msteams
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida (iniciante)

1. Verifique se o plugin do Microsoft Teams está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie um **Azure Bot** (App ID + segredo do cliente + ID do locatário).
3. Configure o OpenClaw com essas credenciais.
4. Exponha `/api/messages` (porta 3978 por padrão) por meio de uma URL pública ou túnel.
5. Instale o pacote do aplicativo do Teams e inicie o gateway.

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

Para implantações em produção, considere usar [autenticação federada](#federated-authentication-certificate--managed-identity) (certificado ou identidade gerenciada) em vez de segredos do cliente.

Observação: chats em grupo ficam bloqueados por padrão (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respostas em grupo, defina `channels.msteams.groupAllowFrom` (ou use `groupPolicy: "open"` para permitir qualquer membro, com exigência de menção).

## Objetivos

- Conversar com o OpenClaw por meio de DMs, chats em grupo ou canais do Teams.
- Manter o roteamento determinístico: as respostas sempre voltam para o canal em que chegaram.
- Usar um comportamento seguro em canais por padrão (menções obrigatórias, a menos que configurado de outra forma).

## Escritas de configuração

Por padrão, o Microsoft Teams tem permissão para gravar atualizações de configuração acionadas por `/config set|unset` (requer `commands.config: true`).

Desative com:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Controle de acesso (DMs + grupos)

**Acesso por DM**

- Padrão: `channels.msteams.dmPolicy = "pairing"`. Remetentes desconhecidos são ignorados até serem aprovados.
- `channels.msteams.allowFrom` deve usar IDs de objeto estáveis do AAD.
- UPNs/nomes de exibição são mutáveis; a correspondência direta fica desativada por padrão e só é ativada com `channels.msteams.dangerouslyAllowNameMatching: true`.
- O assistente pode resolver nomes para IDs via Microsoft Graph quando as credenciais permitirem.

**Acesso em grupo**

- Padrão: `channels.msteams.groupPolicy = "allowlist"` (bloqueado, a menos que você adicione `groupAllowFrom`). Use `channels.defaults.groupPolicy` para substituir o padrão quando não estiver definido.
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

**Teams + lista de permissões de canal**

- Restrinja respostas em grupos/canais listando equipes e canais em `channels.msteams.teams`.
- As chaves devem usar IDs estáveis da equipe e IDs de conversa do canal.
- Quando `groupPolicy="allowlist"` e uma lista de permissões de equipes estiver presente, apenas as equipes/canais listados serão aceitos (com exigência de menção).
- O assistente de configuração aceita entradas `Equipe/Canal` e as armazena para você.
- Na inicialização, o OpenClaw resolve nomes de equipe/canal e nomes de usuários da lista de permissões para IDs (quando as permissões do Graph permitirem)
  e registra o mapeamento; nomes de equipe/canal não resolvidos são mantidos como foram digitados, mas ignorados para roteamento por padrão, a menos que `channels.msteams.dangerouslyAllowNameMatching: true` esteja ativado.

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

## Como funciona

1. Verifique se o plugin do Microsoft Teams está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie um **Azure Bot** (App ID + segredo + ID do locatário).
3. Crie um **pacote de aplicativo do Teams** que faça referência ao bot e inclua as permissões RSC abaixo.
4. Carregue/instale o aplicativo do Teams em uma equipe (ou no escopo pessoal para DMs).
5. Configure `msteams` em `~/.openclaw/openclaw.json` (ou variáveis de ambiente) e inicie o gateway.
6. O gateway escuta o tráfego de Webhook do Bot Framework em `/api/messages` por padrão.

## Configuração do Azure Bot (pré-requisitos)

Antes de configurar o OpenClaw, você precisa criar um recurso Azure Bot.

### Etapa 1: Criar Azure Bot

1. Vá para [Criar Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Preencha a guia **Basics**:

   | Campo              | Valor                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | O nome do seu bot, por exemplo, `openclaw-msteams` (deve ser único) |
   | **Subscription**   | Selecione sua assinatura do Azure                        |
   | **Resource group** | Crie um novo ou use um existente                         |
   | **Pricing tier**   | **Free** para desenvolvimento/testes                     |
   | **Type of App**    | **Single Tenant** (recomendado - consulte a observação abaixo) |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Aviso de descontinuação:** a criação de novos bots multi-tenant foi descontinuada após 2025-07-31. Use **Single Tenant** para novos bots.

3. Clique em **Review + create** → **Create** (aguarde ~1–2 minutos)

### Etapa 2: Obter credenciais

1. Vá para o recurso Azure Bot → **Configuration**
2. Copie **Microsoft App ID** → este é o seu `appId`
3. Clique em **Manage Password** → vá para o App Registration
4. Em **Certificates & secrets** → **New client secret** → copie o **Value** → este é o seu `appPassword`
5. Vá para **Overview** → copie **Directory (tenant) ID** → este é o seu `tenantId`

### Etapa 3: Configurar o endpoint de mensagens

1. No Azure Bot → **Configuration**
2. Defina **Messaging endpoint** como a URL do seu Webhook:
   - Produção: `https://your-domain.com/api/messages`
   - Desenvolvimento local: use um túnel (consulte [Desenvolvimento local](#local-development-tunneling) abaixo)

### Etapa 4: Ativar o canal Teams

1. No Azure Bot → **Channels**
2. Clique em **Microsoft Teams** → Configure → Save
3. Aceite os Terms of Service

## Autenticação federada (certificado + identidade gerenciada)

> Adicionado em 2026.3.24

Para implantações em produção, o OpenClaw oferece suporte a **autenticação federada** como uma alternativa mais segura aos segredos do cliente. Há dois métodos disponíveis:

### Opção A: autenticação baseada em certificado

Use um certificado PEM registrado no seu app registration do Entra ID.

**Configuração:**

1. Gere ou obtenha um certificado (formato PEM com chave privada).
2. No Entra ID → App Registration → **Certificates & secrets** → **Certificates** → carregue o certificado público.

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

Use Azure Managed Identity para autenticação sem senha. Isso é ideal para implantações em infraestrutura Azure (AKS, App Service, VMs do Azure) onde há uma identidade gerenciada disponível.

**Como funciona:**

1. O pod/VM do bot tem uma identidade gerenciada (atribuída pelo sistema ou pelo usuário).
2. Uma **credencial de identidade federada** vincula a identidade gerenciada ao app registration do Entra ID.
3. Em tempo de execução, o OpenClaw usa `@azure/identity` para obter tokens do endpoint Azure IMDS (`169.254.169.254`).
4. O token é passado ao SDK do Teams para autenticação do bot.

**Pré-requisitos:**

- Infraestrutura Azure com identidade gerenciada ativada (AKS workload identity, App Service, VM)
- Credencial de identidade federada criada no app registration do Entra ID
- Acesso de rede ao IMDS (`169.254.169.254:80`) a partir do pod/VM

**Configuração (identidade gerenciada atribuída pelo sistema):**

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

**Configuração (identidade gerenciada atribuída pelo usuário):**

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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (apenas para atribuição pelo usuário)

### Configuração do AKS Workload Identity

Para implantações em AKS usando workload identity:

1. **Ative workload identity** no seu cluster AKS.
2. **Crie uma credencial de identidade federada** no app registration do Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Anote a conta de serviço do Kubernetes** com o ID do cliente do aplicativo:

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

| Método               | Configuração                                   | Prós                               | Contras                               |
| -------------------- | ---------------------------------------------- | ---------------------------------- | ------------------------------------- |
| **Client secret**    | `appPassword`                                  | Configuração simples               | Requer rotação de segredo, menos seguro |
| **Certificate**      | `authType: "federated"` + `certificatePath`    | Sem segredo compartilhado pela rede | Sobrecarga de gerenciamento de certificado |
| **Managed Identity** | `authType: "federated"` + `useManagedIdentity` | Sem senha, sem segredos para gerenciar | Requer infraestrutura Azure         |

**Comportamento padrão:** quando `authType` não está definido, o OpenClaw usa autenticação por segredo do cliente por padrão. Configurações existentes continuam funcionando sem alterações.

## Desenvolvimento local (tunelamento)

O Teams não consegue alcançar `localhost`. Use um túnel para desenvolvimento local:

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

Em vez de criar manualmente um ZIP do manifesto, você pode usar o [Teams Developer Portal](https://dev.teams.microsoft.com/apps):

1. Clique em **+ New app**
2. Preencha as informações básicas (nome, descrição, informações do desenvolvedor)
3. Vá para **App features** → **Bot**
4. Selecione **Enter a bot ID manually** e cole o App ID do seu Azure Bot
5. Marque os escopos: **Personal**, **Team**, **Group Chat**
6. Clique em **Distribute** → **Download app package**
7. No Teams: **Apps** → **Manage your apps** → **Upload a custom app** → selecione o ZIP

Isso costuma ser mais fácil do que editar manifestos JSON manualmente.

## Testando o bot

**Opção A: Azure Web Chat (verifique o Webhook primeiro)**

1. No Azure Portal → seu recurso Azure Bot → **Test in Web Chat**
2. Envie uma mensagem — você deve ver uma resposta
3. Isso confirma que o endpoint do seu Webhook funciona antes da configuração do Teams

**Opção B: Teams (após a instalação do aplicativo)**

1. Instale o aplicativo do Teams (sideload ou catálogo da organização)
2. Encontre o bot no Teams e envie uma DM
3. Verifique os logs do gateway para atividade recebida

## Configuração (mínima, somente texto)

1. **Verifique se o plugin do Microsoft Teams está disponível**
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente:
     - Do npm: `openclaw plugins install @openclaw/msteams`
     - De um checkout local: `openclaw plugins install ./path/to/local/msteams-plugin`

2. **Registro do bot**
   - Crie um Azure Bot (consulte acima) e anote:
     - App ID
     - Segredo do cliente (senha do aplicativo)
     - Tenant ID (single-tenant)

3. **Manifesto do aplicativo do Teams**
   - Inclua uma entrada `bot` com `botId = <App ID>`.
   - Escopos: `personal`, `team`, `groupChat`.
   - `supportsFiles: true` (necessário para manipulação de arquivos no escopo pessoal).
   - Adicione permissões RSC (abaixo).
   - Crie os ícones: `outline.png` (32x32) e `color.png` (192x192).
   - Compacte os três arquivos juntos: `manifest.json`, `outline.png`, `color.png`.

4. **Configure o OpenClaw**

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

   Você também pode usar variáveis de ambiente em vez de chaves de configuração:
   - `MSTEAMS_APP_ID`
   - `MSTEAMS_APP_PASSWORD`
   - `MSTEAMS_TENANT_ID`
   - `MSTEAMS_AUTH_TYPE` (opcional: `"secret"` ou `"federated"`)
   - `MSTEAMS_CERTIFICATE_PATH` (federada + certificado)
   - `MSTEAMS_CERTIFICATE_THUMBPRINT` (opcional, não necessário para autenticação)
   - `MSTEAMS_USE_MANAGED_IDENTITY` (federada + identidade gerenciada)
   - `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (apenas MI atribuída pelo usuário)

5. **Endpoint do bot**
   - Defina o Messaging Endpoint do Azure Bot como:
     - `https://<host>:3978/api/messages` (ou o caminho/porta escolhidos).

6. **Execute o gateway**
   - O canal Teams inicia automaticamente quando o plugin incluído ou instalado manualmente está disponível e a configuração `msteams` existe com credenciais.

## Ação de informações do membro

O OpenClaw expõe uma ação `member-info` baseada em Graph para Microsoft Teams, para que agentes e automações possam resolver detalhes de membros do canal (nome de exibição, email, função) diretamente do Microsoft Graph.

Requisitos:

- Permissão RSC `Member.Read.Group` (já presente no manifesto recomendado)
- Para buscas entre equipes: permissão de aplicativo Graph `User.Read.All` com consentimento de administrador

A ação é controlada por `channels.msteams.actions.memberInfo` (padrão: ativada quando credenciais do Graph estão disponíveis).

## Contexto do histórico

- `channels.msteams.historyLimit` controla quantas mensagens recentes do canal/grupo são incluídas no prompt.
- Usa `messages.groupChat.historyLimit` como fallback. Defina `0` para desativar (padrão: 50).
- O histórico de thread buscado é filtrado pelas listas de permissões de remetente (`allowFrom` / `groupAllowFrom`), portanto a semeadura de contexto da thread inclui apenas mensagens de remetentes permitidos.
- O contexto de anexo citado (`ReplyTo*` derivado do HTML de resposta do Teams) atualmente é repassado como recebido.
- Em outras palavras, as listas de permissões controlam quem pode acionar o agente; apenas alguns caminhos específicos de contexto suplementar são filtrados hoje.
- O histórico de DM pode ser limitado com `channels.msteams.dmHistoryLimit` (turnos do usuário). Substituições por usuário: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permissões RSC atuais do Teams (manifesto)

Estas são as **permissões resourceSpecific existentes** no manifesto do nosso aplicativo do Teams. Elas se aplicam apenas dentro da equipe/chat em que o aplicativo está instalado.

**Para canais (escopo de equipe):**

- `ChannelMessage.Read.Group` (Application) - receber todo o conteúdo de texto das mensagens do canal sem @mention
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Para chats em grupo:**

- `ChatMessage.Read.Chat` (Application) - receber todas as mensagens de chat em grupo sem @mention

## Exemplo de manifesto do Teams (redigido)

Exemplo mínimo e válido com os campos necessários. Substitua IDs e URLs.

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

- `bots[].botId` **deve** corresponder ao App ID do Azure Bot.
- `webApplicationInfo.id` **deve** corresponder ao App ID do Azure Bot.
- `bots[].scopes` deve incluir as superfícies que você planeja usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` é necessário para manipulação de arquivos no escopo pessoal.
- `authorization.permissions.resourceSpecific` deve incluir leitura/envio de canal se você quiser tráfego de canal.

### Atualizando um aplicativo existente

Para atualizar um aplicativo do Teams já instalado (por exemplo, para adicionar permissões RSC):

1. Atualize seu `manifest.json` com as novas configurações
2. **Incremente o campo `version`** (por exemplo, `1.0.0` → `1.1.0`)
3. **Compacte novamente** o manifesto com os ícones (`manifest.json`, `outline.png`, `color.png`)
4. Envie o novo zip:
   - **Opção A (Teams Admin Center):** Teams Admin Center → Teams apps → Manage apps → encontre seu aplicativo → Upload new version
   - **Opção B (Sideload):** No Teams → Apps → Manage your apps → Upload a custom app
5. **Para canais de equipe:** reinstale o aplicativo em cada equipe para que as novas permissões entrem em vigor
6. **Feche completamente e reabra o Teams** (não apenas feche a janela) para limpar os metadados em cache do aplicativo

## Capacidades: somente RSC vs Graph

### Com **apenas Teams RSC** (aplicativo instalado, sem permissões da API Graph)

Funciona:

- Ler conteúdo de **texto** de mensagens de canal.
- Enviar conteúdo de **texto** de mensagens de canal.
- Receber anexos de arquivo em **escopo pessoal (DM)**.

NÃO funciona:

- Conteúdo de **imagem ou arquivo** em canal/grupo (a carga inclui apenas um stub HTML).
- Download de anexos armazenados no SharePoint/OneDrive.
- Leitura do histórico de mensagens (além do evento de Webhook ao vivo).

### Com **Teams RSC + permissões de aplicativo do Microsoft Graph**

Adiciona:

- Download de conteúdos hospedados (imagens coladas em mensagens).
- Download de anexos de arquivo armazenados no SharePoint/OneDrive.
- Leitura do histórico de mensagens de canal/chat via Graph.

### RSC vs API Graph

| Capacidade              | Permissões RSC       | API Graph                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Mensagens em tempo real** | Sim (via Webhook) | Não (apenas polling)                |
| **Mensagens históricas** | Não                | Sim (pode consultar o histórico)    |
| **Complexidade da configuração** | Apenas manifesto do aplicativo | Requer consentimento de administrador + fluxo de token |
| **Funciona offline**    | Não (precisa estar em execução) | Sim (consulta a qualquer momento) |

**Resumo:** RSC serve para escuta em tempo real; a API Graph serve para acesso histórico. Para recuperar mensagens perdidas enquanto estava offline, você precisa da API Graph com `ChannelMessage.Read.All` (requer consentimento de administrador).

## Mídia + histórico com Graph ativado (necessário para canais)

Se você precisa de imagens/arquivos em **canais** ou quer buscar **histórico de mensagens**, deve ativar permissões do Microsoft Graph e conceder consentimento de administrador.

1. No **App Registration** do Entra ID (Azure AD), adicione permissões de **Application** do Microsoft Graph:
   - `ChannelMessage.Read.All` (anexos de canal + histórico)
   - `Chat.Read.All` ou `ChatMessage.Read.All` (chats em grupo)
2. **Conceda consentimento de administrador** para o locatário.
3. Aumente a **versão do manifesto** do aplicativo do Teams, reenvie-o e **reinstale o aplicativo no Teams**.
4. **Feche completamente e reabra o Teams** para limpar os metadados em cache do aplicativo.

**Permissão adicional para menções de usuário:** menções @ de usuários funcionam imediatamente para usuários na conversa. No entanto, se você quiser pesquisar e mencionar dinamicamente usuários que **não estão na conversa atual**, adicione a permissão `User.Read.All` (Application) e conceda consentimento de administrador.

## Limitações conhecidas

### Timeouts do Webhook

O Teams entrega mensagens por Webhook HTTP. Se o processamento demorar muito (por exemplo, respostas lentas do LLM), você poderá ver:

- Timeouts do gateway
- O Teams tentando reenviar a mensagem (causando duplicatas)
- Respostas descartadas

O OpenClaw lida com isso retornando rapidamente e enviando respostas de forma proativa, mas respostas muito lentas ainda podem causar problemas.

### Formatação

O markdown do Teams é mais limitado do que o do Slack ou Discord:

- A formatação básica funciona: **negrito**, _itálico_, `code`, links
- Markdown complexo (tabelas, listas aninhadas) pode não ser renderizado corretamente
- Adaptive Cards são compatíveis para enquetes e envios de apresentação semântica (consulte abaixo)

## Configuração

Principais configurações (consulte `/gateway/configuration` para padrões compartilhados de canal):

- `channels.msteams.enabled`: ativa/desativa o canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenciais do bot.
- `channels.msteams.webhook.port` (padrão `3978`)
- `channels.msteams.webhook.path` (padrão `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing)
- `channels.msteams.allowFrom`: lista de permissões de DM (IDs de objeto AAD recomendados). O assistente resolve nomes para IDs durante a configuração quando o acesso ao Graph está disponível.
- `channels.msteams.dangerouslyAllowNameMatching`: alternância emergencial para reativar a correspondência mutável por UPN/nome de exibição e o roteamento direto por nome de equipe/canal.
- `channels.msteams.textChunkLimit`: tamanho do fragmento de texto de saída.
- `channels.msteams.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por tamanho.
- `channels.msteams.mediaAllowHosts`: lista de permissões de hosts para anexos de entrada (por padrão, domínios da Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: lista de permissões de hosts para anexar cabeçalhos `Authorization` em novas tentativas de mídia (por padrão, hosts do Graph + Bot Framework).
- `channels.msteams.requireMention`: exige @mention em canais/grupos (padrão: true).
- `channels.msteams.replyStyle`: `thread | top-level` (consulte [Estilo de resposta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: substituição por equipe.
- `channels.msteams.teams.<teamId>.requireMention`: substituição por equipe.
- `channels.msteams.teams.<teamId>.tools`: substituições padrão por equipe para política de ferramentas (`allow`/`deny`/`alsoAllow`) usadas quando falta uma substituição por canal.
- `channels.msteams.teams.<teamId>.toolsBySender`: substituições padrão por equipe para política de ferramentas por remetente (`"*"` com curinga compatível).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: substituições de política de ferramentas por canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: substituições de política de ferramentas por canal e por remetente (`"*"` com curinga compatível).
- As chaves `toolsBySender` devem usar prefixos explícitos:
  `id:`, `e164:`, `username:`, `name:` (chaves legadas sem prefixo ainda são mapeadas apenas para `id:`).
- `channels.msteams.actions.memberInfo`: ativa ou desativa a ação de informações do membro baseada em Graph (padrão: ativada quando credenciais do Graph estão disponíveis).
- `channels.msteams.authType`: tipo de autenticação — `"secret"` (padrão) ou `"federated"`.
- `channels.msteams.certificatePath`: caminho para o arquivo de certificado PEM (autenticação federada + certificado).
- `channels.msteams.certificateThumbprint`: impressão digital do certificado (opcional, não necessária para autenticação).
- `channels.msteams.useManagedIdentity`: ativa autenticação por identidade gerenciada (modo federado).
- `channels.msteams.managedIdentityClientId`: ID do cliente para identidade gerenciada atribuída pelo usuário.
- `channels.msteams.sharePointSiteId`: ID do site do SharePoint para uploads de arquivos em chats/canais de grupo (consulte [Envio de arquivos em chats de grupo](#sending-files-in-group-chats)).

## Roteamento e sessões

- As chaves de sessão seguem o formato padrão de agente (consulte [/concepts/session](/pt-BR/concepts/session)):
  - Mensagens diretas compartilham a sessão principal (`agent:<agentId>:<mainKey>`).
  - Mensagens de canal/grupo usam o ID da conversa:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de resposta: threads vs posts

O Teams introduziu recentemente dois estilos de interface de canal sobre o mesmo modelo de dados subjacente:

| Estilo                  | Descrição                                               | `replyStyle` recomendado |
| ----------------------- | ------------------------------------------------------- | ------------------------ |
| **Posts** (clássico)    | As mensagens aparecem como cartões com respostas em thread abaixo | `thread` (padrão)        |
| **Threads** (estilo Slack) | As mensagens fluem linearmente, mais como no Slack   | `top-level`              |

**O problema:** a API do Teams não informa qual estilo de interface um canal usa. Se você usar o `replyStyle` errado:

- `thread` em um canal no estilo Threads → as respostas aparecem aninhadas de forma estranha
- `top-level` em um canal no estilo Posts → as respostas aparecem como posts separados no nível superior, em vez de dentro da thread

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

- **DMs:** imagens e anexos de arquivo funcionam por meio das APIs de arquivo do bot do Teams.
- **Canais/grupos:** os anexos ficam no armazenamento do M365 (SharePoint/OneDrive). A carga do Webhook inclui apenas um stub HTML, não os bytes reais do arquivo. **Permissões da API Graph são necessárias** para baixar anexos de canal.
- Para envios explícitos com arquivo em primeiro lugar, use `action=upload-file` com `media` / `filePath` / `path`; `message` opcional se torna o texto/comentário que acompanha o envio, e `filename` substitui o nome enviado.

Sem permissões do Graph, mensagens de canal com imagens serão recebidas apenas como texto (o conteúdo da imagem não fica acessível ao bot).
Por padrão, o OpenClaw baixa mídia apenas de nomes de host da Microsoft/Teams. Substitua com `channels.msteams.mediaAllowHosts` (use `["*"]` para permitir qualquer host).
Os cabeçalhos `Authorization` só são anexados para hosts em `channels.msteams.mediaAuthAllowHosts` (por padrão, hosts do Graph + Bot Framework). Mantenha essa lista restrita (evite sufixos multi-tenant).

## Envio de arquivos em chats de grupo

Bots podem enviar arquivos em DMs usando o fluxo FileConsentCard (integrado). No entanto, **o envio de arquivos em chats/canais de grupo** requer configuração adicional:

| Contexto                 | Como os arquivos são enviados              | Configuração necessária                         |
| ------------------------ | ------------------------------------------ | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → usuário aceita → bot envia | Funciona imediatamente                         |
| **Chats/canais de grupo** | Upload para o SharePoint → compartilhar link | Requer `sharePointSiteId` + permissões do Graph |
| **Imagens (qualquer contexto)** | Inline codificado em Base64         | Funciona imediatamente                         |

### Por que chats de grupo precisam do SharePoint

Bots não têm um drive pessoal do OneDrive (o endpoint da API Graph `/me/drive` não funciona para identidades de aplicativo). Para enviar arquivos em chats/canais de grupo, o bot faz upload para um **site do SharePoint** e cria um link de compartilhamento.

### Configuração

1. **Adicione permissões da API Graph** em Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - enviar arquivos para o SharePoint
   - `Chat.Read.All` (Application) - opcional, ativa links de compartilhamento por usuário

2. **Conceda consentimento de administrador** para o locatário.

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
         // ... outra configuração ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportamento de compartilhamento

| Permissão                              | Comportamento de compartilhamento                         |
| -------------------------------------- | --------------------------------------------------------- |
| `Sites.ReadWrite.All` apenas           | Link de compartilhamento para toda a organização (qualquer pessoa da organização pode acessar) |
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

## Enquetes (Adaptive Cards)

O OpenClaw envia enquetes do Teams como Adaptive Cards (não há uma API nativa de enquetes do Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Os votos são registrados pelo gateway em `~/.openclaw/msteams-polls.json`.
- O gateway deve permanecer online para registrar votos.
- As enquetes ainda não publicam resumos de resultados automaticamente (inspecione o arquivo de armazenamento, se necessário).

## Cartões de apresentação

Envie cargas semânticas de apresentação para usuários ou conversas do Teams usando a ferramenta `message` ou a CLI. O OpenClaw as renderiza como Adaptive Cards do Teams a partir do contrato genérico de apresentação.

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

Os destinos do MSTeams usam prefixos para diferenciar usuários de conversas:

| Tipo de destino       | Formato                         | Exemplo                                             |
| --------------------- | ------------------------------- | --------------------------------------------------- |
| Usuário (por ID)      | `user:<aad-object-id>`          | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Usuário (por nome)    | `user:<display-name>`           | `user:John Smith` (requer API Graph)               |
| Grupo/canal           | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Grupo/canal (bruto)   | `<conversation-id>`             | `19:abc123...@thread.tacv2` (se contiver `@thread`) |

**Exemplos de CLI:**

```bash
# Enviar para um usuário por ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Enviar para um usuário por nome de exibição (aciona pesquisa na API Graph)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Enviar para um chat em grupo ou canal
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Enviar um cartão de apresentação para uma conversa
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Hello","blocks":[{"type":"text","text":"Hello"}]}'
```

**Exemplos da ferramenta do agente:**

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

Observação: sem o prefixo `user:`, os nomes usam por padrão a resolução de grupo/equipe. Sempre use `user:` ao direcionar pessoas pelo nome de exibição.

## Mensagens proativas

- Mensagens proativas só são possíveis **depois** que um usuário interagiu, porque armazenamos referências de conversa nesse momento.
- Consulte `/gateway/configuration` para `dmPolicy` e o controle por lista de permissões.

## IDs de equipe e canal (erro comum)

O parâmetro de consulta `groupId` em URLs do Teams **NÃO** é o ID da equipe usado para configuração. Extraia os IDs do caminho da URL:

**URL da equipe:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID da equipe (faça URL decode)
```

**URL do canal:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID do canal (faça URL decode)
```

**Para configuração:**

- ID da equipe = segmento do caminho após `/team/` (com URL decode, por exemplo, `19:Bk4j...@thread.tacv2`)
- ID do canal = segmento do caminho após `/channel/` (com URL decode)
- **Ignore** o parâmetro de consulta `groupId`

## Canais privados

Bots têm suporte limitado em canais privados:

| Recurso                      | Canais padrão     | Canais privados       |
| --------------------------- | ----------------- | --------------------- |
| Instalação do bot           | Sim               | Limitada              |
| Mensagens em tempo real (Webhook) | Sim         | Pode não funcionar    |
| Permissões RSC              | Sim               | Pode se comportar de forma diferente |
| @mentions                   | Sim               | Se o bot estiver acessível |
| Histórico pela API Graph    | Sim               | Sim (com permissões)  |

**Soluções alternativas se canais privados não funcionarem:**

1. Use canais padrão para interações com o bot
2. Use DMs — os usuários sempre podem enviar mensagem diretamente ao bot
3. Use a API Graph para acesso histórico (requer `ChannelMessage.Read.All`)

## Solução de problemas

### Problemas comuns

- **Imagens não aparecem em canais:** faltam permissões do Graph ou consentimento de administrador. Reinstale o aplicativo do Teams e feche/reabra totalmente o Teams.
- **Sem respostas no canal:** menções são exigidas por padrão; defina `channels.msteams.requireMention=false` ou configure por equipe/canal.
- **Incompatibilidade de versão (o Teams ainda mostra o manifesto antigo):** remova e adicione novamente o aplicativo e feche totalmente o Teams para atualizar.
- **401 Unauthorized do Webhook:** esperado ao testar manualmente sem JWT do Azure — significa que o endpoint está acessível, mas a autenticação falhou. Use o Azure Web Chat para testar corretamente.

### Erros de upload do manifesto

- **"Icon file cannot be empty":** o manifesto faz referência a arquivos de ícone com 0 bytes. Crie ícones PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** o aplicativo ainda está instalado em outra equipe/chat. Encontre e desinstale-o primeiro ou aguarde de 5 a 10 minutos pela propagação.
- **"Something went wrong" ao fazer upload:** faça o upload por [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), abra o DevTools do navegador (F12) → aba Network e verifique o corpo da resposta para ver o erro real.
- **Falha no sideload:** tente "Upload an app to your org's app catalog" em vez de "Upload a custom app" — isso geralmente contorna restrições de sideload.

### Permissões RSC não funcionam

1. Verifique se `webApplicationInfo.id` corresponde exatamente ao App ID do seu bot
2. Reenvie o aplicativo e reinstale-o na equipe/chat
3. Verifique se o administrador da sua organização bloqueou permissões RSC
4. Confirme que você está usando o escopo correto: `ChannelMessage.Read.Group` para equipes, `ChatMessage.Read.Chat` para chats em grupo

## Referências

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guia de configuração do Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - criar/gerenciar aplicativos do Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo requer Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e exigência de menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e fortalecimento
