---
read_when:
    - Trabalhando nos recursos do canal do Microsoft Teams
summary: Status do suporte ao bot do Microsoft Teams, recursos e configuração
title: Microsoft Teams
x-i18n:
    generated_at: "2026-04-26T11:23:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 497bd2a0216f7de2345a52b178567964884a4bf6801daef3a2529f92b794cb0c
    source_path: channels/msteams.md
    workflow: 15
---

Status: texto + anexos em DM são compatíveis; o envio de arquivos em canais/grupos exige `sharePointSiteId` + permissões do Graph (consulte [Enviando arquivos em chats em grupo](#sending-files-in-group-chats)). Enquetes são enviadas por meio de Adaptive Cards. As ações de mensagem expõem `upload-file` explícito para envios com arquivo em primeiro lugar.

## Plugin incluído

Microsoft Teams é fornecido como um Plugin incluído nas versões atuais do OpenClaw, portanto não é necessária nenhuma instalação separada na compilação empacotada normal.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o Teams incluído, instale-o manualmente:

```bash
openclaw plugins install @openclaw/msteams
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

O [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) cuida do registro do bot, da criação do manifesto e da geração de credenciais em um único comando.

**1. Instale e faça login**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verifique se você está conectado e veja as informações do seu locatário
```

> **Observação:** o Teams CLI está atualmente em preview. Comandos e flags podem mudar entre versões.

**2. Inicie um túnel** (o Teams não consegue alcançar o localhost)

Instale e autentique a CLI do devtunnel se ainda não tiver feito isso ([guia de introdução](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Configuração única (URL persistente entre sessões):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Em cada sessão de desenvolvimento:
devtunnel host my-openclaw-bot
# Seu endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

> **Observação:** `--allow-anonymous` é obrigatório porque o Teams não consegue se autenticar com devtunnels. Cada solicitação de bot recebida ainda é validada automaticamente pelo SDK do Teams.

Alternativas: `ngrok http 3978` ou `tailscale funnel 3978` (mas podem mudar as URLs a cada sessão).

**3. Crie o aplicativo**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Este comando único:

- Cria um aplicativo Entra ID (Azure AD)
- Gera um segredo do cliente
- Compila e envia um manifesto de aplicativo do Teams (com ícones)
- Registra o bot (gerenciado pelo Teams por padrão — não é necessária assinatura do Azure)

A saída mostrará `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` e um **Teams App ID** — anote-os para as próximas etapas. Ela também oferece instalar o aplicativo diretamente no Teams.

**4. Configure o OpenClaw** usando as credenciais da saída:

```json5
{
  channels: {
    msteams: {
      enabled: true,
      appId: "<CLIENT_ID>",
      appPassword: "<CLIENT_SECRET>",
      tenantId: "<TENANT_ID>",
      webhook: { port: 3978, path: "/api/messages" },
    },
  },
}
```

Ou use variáveis de ambiente diretamente: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Instale o aplicativo no Teams**

`teams app create` solicitará que você instale o aplicativo — selecione "Install in Teams". Se você pulou essa etapa, poderá obter o link depois:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifique se tudo funciona**

```bash
teams app doctor <teamsAppId>
```

Isso executa diagnósticos em todo o registro do bot, configuração do aplicativo AAD, validade do manifesto e configuração de SSO.

Para implantações em produção, considere usar [autenticação federada](#federated-authentication-certificate--managed-identity) (certificado ou identidade gerenciada) em vez de segredos do cliente.

Observação: chats em grupo são bloqueados por padrão (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respostas em grupo, defina `channels.msteams.groupAllowFrom` (ou use `groupPolicy: "open"` para permitir qualquer membro, com exigência de menção).

## Objetivos

- Conversar com o OpenClaw via DMs, chats em grupo ou canais do Teams.
- Manter o roteamento determinístico: as respostas sempre retornam ao canal em que chegaram.
- Adotar um comportamento de canal seguro por padrão (menções obrigatórias, salvo configuração em contrário).

## Escritas de configuração

Por padrão, o Microsoft Teams tem permissão para gravar atualizações de configuração acionadas por `/config set|unset` (exige `commands.config: true`).

Desative com:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Controle de acesso (DMs + grupos)

**Acesso por DM**

- Padrão: `channels.msteams.dmPolicy = "pairing"`. Remetentes desconhecidos são ignorados até serem aprovados.
- `channels.msteams.allowFrom` deve usar IDs de objeto AAD estáveis.
- Não confie em correspondência de UPN/nome de exibição para listas de permissões — eles podem mudar. O OpenClaw desativa a correspondência direta por nome por padrão; habilite explicitamente com `channels.msteams.dangerouslyAllowNameMatching: true`.
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

**Lista de permissões de Teams + canal**

- Delimite respostas de grupo/canal listando times e canais em `channels.msteams.teams`.
- As chaves devem usar IDs estáveis do time e IDs de conversa do canal.
- Quando `groupPolicy="allowlist"` e uma lista de permissões de times está presente, somente os times/canais listados são aceitos (com exigência de menção).
- O assistente de configuração aceita entradas `Team/Channel` e as armazena para você.
- Na inicialização, o OpenClaw resolve nomes de lista de permissões de time/canal e usuário para IDs (quando as permissões do Graph permitem)
  e registra o mapeamento; nomes de time/canal não resolvidos são mantidos como digitados, mas ignorados para roteamento por padrão, a menos que `channels.msteams.dangerouslyAllowNameMatching: true` esteja ativado.

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

<details>
<summary><strong>Configuração manual (sem o Teams CLI)</strong></summary>

Se você não puder usar o Teams CLI, poderá configurar o bot manualmente pelo Portal do Azure.

### Como funciona

1. Verifique se o plugin do Microsoft Teams está disponível (incluído nas versões atuais).
2. Crie um **Azure Bot** (App ID + segredo + tenant ID).
3. Monte um **pacote de aplicativo do Teams** que referencie o bot e inclua as permissões de RSC abaixo.
4. Envie/instale o aplicativo do Teams em um time (ou escopo pessoal para DMs).
5. Configure `msteams` em `~/.openclaw/openclaw.json` (ou variáveis de ambiente) e inicie o gateway.
6. O Gateway escuta tráfego de Webhook do Bot Framework em `/api/messages` por padrão.

### Etapa 1: criar o Azure Bot

1. Acesse [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Preencha a guia **Basics**:

   | Campo              | Valor                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | O nome do seu bot, por exemplo, `openclaw-msteams` (deve ser único) |
   | **Subscription**   | Selecione sua assinatura do Azure                        |
   | **Resource group** | Crie um novo ou use um existente                         |
   | **Pricing tier**   | **Free** para desenvolvimento/testes                     |
   | **Type of App**    | **Single Tenant** (recomendado - veja a observação abaixo) |
   | **Creation type**  | **Create new Microsoft App ID**                          |

> **Aviso de descontinuação:** a criação de novos bots multilocatário foi descontinuada após 2025-07-31. Use **Single Tenant** para novos bots.

3. Clique em **Review + create** → **Create** (aguarde ~1-2 minutos)

### Etapa 2: obter credenciais

1. Acesse o recurso Azure Bot → **Configuration**
2. Copie **Microsoft App ID** → este é o seu `appId`
3. Clique em **Manage Password** → vá para o Registro de Aplicativo
4. Em **Certificates & secrets** → **New client secret** → copie o **Value** → este é o seu `appPassword`
5. Vá para **Overview** → copie **Directory (tenant) ID** → este é o seu `tenantId`

### Etapa 3: configurar o endpoint de mensagens

1. Em Azure Bot → **Configuration**
2. Defina **Messaging endpoint** como sua URL de webhook:
   - Produção: `https://your-domain.com/api/messages`
   - Desenvolvimento local: use um túnel (consulte [Desenvolvimento local](#local-development-tunneling) abaixo)

### Etapa 4: habilitar o canal do Teams

1. Em Azure Bot → **Channels**
2. Clique em **Microsoft Teams** → Configure → Save
3. Aceite os Termos de Serviço

### Etapa 5: montar o manifesto do aplicativo do Teams

- Inclua uma entrada `bot` com `botId = <App ID>`.
- Escopos: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (obrigatório para manipulação de arquivos no escopo pessoal).
- Adicione permissões de RSC (consulte [Permissões de RSC](#current-teams-rsc-permissions-manifest)).
- Crie ícones: `outline.png` (32x32) e `color.png` (192x192).
- Compacte os três arquivos juntos: `manifest.json`, `outline.png`, `color.png`.

### Etapa 6: configurar o OpenClaw

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

Variáveis de ambiente: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

### Etapa 7: executar o Gateway

O canal do Teams inicia automaticamente quando o plugin está disponível e a configuração `msteams` existe com credenciais.

</details>

## Autenticação federada (certificado + identidade gerenciada)

> Adicionado em 2026.3.24

Para implantações em produção, o OpenClaw oferece suporte a **autenticação federada** como uma alternativa mais segura aos segredos do cliente. Dois métodos estão disponíveis:

### Opção A: autenticação baseada em certificado

Use um certificado PEM registrado no registro do seu aplicativo Entra ID.

**Configuração:**

1. Gere ou obtenha um certificado (formato PEM com chave privada).
2. Em Entra ID → App Registration → **Certificates & secrets** → **Certificates** → envie o certificado público.

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

Use Azure Managed Identity para autenticação sem senha. Isso é ideal para implantações na infraestrutura do Azure (AKS, App Service, VMs do Azure) em que uma identidade gerenciada está disponível.

**Como funciona:**

1. O pod/VM do bot tem uma identidade gerenciada (atribuída pelo sistema ou pelo usuário).
2. Uma **credencial de identidade federada** vincula a identidade gerenciada ao registro do aplicativo Entra ID.
3. Em tempo de execução, o OpenClaw usa `@azure/identity` para adquirir tokens do endpoint Azure IMDS (`169.254.169.254`).
4. O token é passado ao SDK do Teams para autenticação do bot.

**Pré-requisitos:**

- Infraestrutura do Azure com identidade gerenciada habilitada (AKS workload identity, App Service, VM)
- Credencial de identidade federada criada no registro do aplicativo Entra ID
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
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (somente para atribuída pelo usuário)

### Configuração do AKS Workload Identity

Para implantações em AKS usando workload identity:

1. **Habilite workload identity** no cluster do AKS.
2. **Crie uma credencial de identidade federada** no registro do aplicativo Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Anote a service account do Kubernetes** com o client ID do aplicativo:

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

| Método                 | Configuração                                  | Prós                              | Contras                               |
| ---------------------- | --------------------------------------------- | --------------------------------- | ------------------------------------- |
| **Segredo do cliente** | `appPassword`                                 | Configuração simples              | Exige rotação de segredo, menos seguro |
| **Certificado**        | `authType: "federated"` + `certificatePath`   | Sem segredo compartilhado na rede | Sobrecarga de gerenciamento de certificado |
| **Managed Identity**   | `authType: "federated"` + `useManagedIdentity` | Sem senha, sem segredos para gerenciar | Requer infraestrutura Azure         |

**Comportamento padrão:** quando `authType` não está definido, o OpenClaw usa autenticação por segredo do cliente por padrão. Configurações existentes continuam funcionando sem alterações.

## Desenvolvimento local (tunelamento)

O Teams não consegue alcançar `localhost`. Use um túnel de desenvolvimento persistente para que sua URL permaneça a mesma entre sessões:

```bash
# Configuração única:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Em cada sessão de desenvolvimento:
devtunnel host my-openclaw-bot
```

Alternativas: `ngrok http 3978` ou `tailscale funnel 3978` (as URLs podem mudar a cada sessão).

Se a URL do seu túnel mudar, atualize o endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Testando o bot

**Execute diagnósticos:**

```bash
teams app doctor <teamsAppId>
```

Verifica registro do bot, aplicativo AAD, manifesto e configuração de SSO em uma única execução.

**Envie uma mensagem de teste:**

1. Instale o aplicativo do Teams (use o link de instalação de `teams app get <id> --install-link`)
2. Encontre o bot no Teams e envie uma DM
3. Verifique os logs do Gateway para atividade recebida

## Variáveis de ambiente

Todas as chaves de configuração também podem ser definidas por variáveis de ambiente:

- `MSTEAMS_APP_ID`
- `MSTEAMS_APP_PASSWORD`
- `MSTEAMS_TENANT_ID`
- `MSTEAMS_AUTH_TYPE` (opcional: `"secret"` ou `"federated"`)
- `MSTEAMS_CERTIFICATE_PATH` (federated + certificate)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (opcional, não obrigatório para autenticação)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federated + managed identity)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (somente MI atribuída pelo usuário)

## Ação de informações de membro

O OpenClaw expõe uma ação `member-info` com suporte do Graph para o Microsoft Teams, para que agentes e automações possam resolver detalhes de membros do canal (nome de exibição, e-mail, função) diretamente do Microsoft Graph.

Requisitos:

- Permissão RSC `Member.Read.Group` (já incluída no manifesto recomendado)
- Para buscas entre times: permissão de aplicativo do Graph `User.Read.All` com consentimento de administrador

A ação é controlada por `channels.msteams.actions.memberInfo` (padrão: ativada quando credenciais do Graph estão disponíveis).

## Contexto do histórico

- `channels.msteams.historyLimit` controla quantas mensagens recentes de canal/grupo são encapsuladas no prompt.
- Usa `messages.groupChat.historyLimit` como fallback. Defina `0` para desativar (padrão 50).
- O histórico de tópico buscado é filtrado por listas de permissões de remetente (`allowFrom` / `groupAllowFrom`), portanto a semeadura de contexto do tópico inclui apenas mensagens de remetentes permitidos.
- O contexto de anexo citado (`ReplyTo*` derivado do HTML de resposta do Teams) atualmente é passado como recebido.
- Em outras palavras, listas de permissões controlam quem pode acionar o agente; hoje apenas caminhos específicos de contexto suplementar são filtrados.
- O histórico de DM pode ser limitado com `channels.msteams.dmHistoryLimit` (turnos do usuário). Substituições por usuário: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permissões RSC atuais do Teams (manifesto)

Estas são as **permissões resourceSpecific existentes** no nosso manifesto de aplicativo do Teams. Elas se aplicam somente dentro do time/chat em que o aplicativo está instalado.

**Para canais (escopo de time):**

- `ChannelMessage.Read.Group` (Application) - receber todas as mensagens do canal sem @menção
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Para chats em grupo:**

- `ChatMessage.Read.Chat` (Application) - receber todas as mensagens de chat em grupo sem @menção

Para adicionar permissões RSC via Teams CLI:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Exemplo de manifesto do Teams (com dados ocultados)

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

- `bots[].botId` **deve** corresponder ao App ID do Azure Bot.
- `webApplicationInfo.id` **deve** corresponder ao App ID do Azure Bot.
- `bots[].scopes` deve incluir as superfícies que você pretende usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` é obrigatório para manipulação de arquivos no escopo pessoal.
- `authorization.permissions.resourceSpecific` deve incluir leitura/envio de canal se você quiser tráfego de canal.

### Atualizando um aplicativo existente

Para atualizar um aplicativo do Teams já instalado (por exemplo, para adicionar permissões RSC):

```bash
# Baixe, edite e reenvie o manifesto
teams app manifest download <teamsAppId> manifest.json
# Edite manifest.json localmente...
teams app manifest upload manifest.json <teamsAppId>
# A versão é incrementada automaticamente se o conteúdo mudou
```

Depois de atualizar, reinstale o aplicativo em cada time para que as novas permissões entrem em vigor e **encerre completamente e reinicie o Teams** (não apenas feche a janela) para limpar os metadados em cache do aplicativo.

<details>
<summary>Atualização manual do manifesto (sem CLI)</summary>

1. Atualize seu `manifest.json` com as novas configurações
2. **Incremente o campo `version`** (por exemplo, `1.0.0` → `1.1.0`)
3. **Compacte novamente** o manifesto com os ícones (`manifest.json`, `outline.png`, `color.png`)
4. Envie o novo zip:
   - **Teams Admin Center:** Teams apps → Manage apps → encontre seu aplicativo → Upload new version
   - **Sideload:** No Teams → Apps → Manage your apps → Upload a custom app

</details>

## Recursos: somente RSC vs Graph

### Com **somente Teams RSC** (aplicativo instalado, sem permissões de API do Graph)

Funciona:

- Ler conteúdo de **texto** de mensagem de canal.
- Enviar conteúdo de **texto** de mensagem de canal.
- Receber anexos de arquivo em **escopo pessoal (DM)**.

NÃO funciona:

- Conteúdo de **imagem ou arquivo** em canal/grupo (a carga útil inclui apenas um stub HTML).
- Baixar anexos armazenados no SharePoint/OneDrive.
- Ler histórico de mensagens (além do evento de webhook em tempo real).

### Com **Teams RSC + permissões de aplicativo do Microsoft Graph**

Adiciona:

- Download de conteúdos hospedados (imagens coladas em mensagens).
- Download de anexos de arquivo armazenados no SharePoint/OneDrive.
- Leitura do histórico de mensagens de canal/chat via Graph.

### RSC vs Graph API

| Recurso                 | Permissões RSC       | Graph API                           |
| ----------------------- | -------------------- | ----------------------------------- |
| **Mensagens em tempo real** | Sim (via webhook) | Não (somente polling)               |
| **Mensagens históricas** | Não                 | Sim (pode consultar histórico)      |
| **Complexidade de configuração** | Somente manifesto do app | Exige consentimento de administrador + fluxo de token |
| **Funciona offline**    | Não (precisa estar em execução) | Sim (consulta a qualquer momento) |

**Resumo:** RSC é para escuta em tempo real; Graph API é para acesso histórico. Para recuperar mensagens perdidas enquanto estiver offline, você precisa de Graph API com `ChannelMessage.Read.All` (exige consentimento de administrador).

## Mídia + histórico com Graph habilitado (obrigatório para canais)

Se você precisa de imagens/arquivos em **canais** ou quer buscar **histórico de mensagens**, deve habilitar permissões do Microsoft Graph e conceder consentimento de administrador.

1. No **App Registration** do Entra ID (Azure AD), adicione permissões de **Application** do Microsoft Graph:
   - `ChannelMessage.Read.All` (anexos e histórico de canal)
   - `Chat.Read.All` ou `ChatMessage.Read.All` (chats em grupo)
2. **Conceda consentimento de administrador** para o locatário.
3. Incremente a **versão do manifesto** do aplicativo do Teams, reenvie-o e **reinstale o aplicativo no Teams**.
4. **Encerre completamente e reinicie o Teams** para limpar os metadados em cache do aplicativo.

**Permissão adicional para menções de usuários:** @menções de usuário funcionam imediatamente para usuários na conversa. No entanto, se você quiser pesquisar e mencionar dinamicamente usuários que **não estão na conversa atual**, adicione a permissão de aplicativo `User.Read.All` e conceda consentimento de administrador.

## Limitações conhecidas

### Timeouts de Webhook

O Teams entrega mensagens por Webhook HTTP. Se o processamento demorar muito (por exemplo, respostas lentas do LLM), você poderá ver:

- Timeouts do Gateway
- O Teams tentando novamente a mensagem (causando duplicatas)
- Respostas descartadas

O OpenClaw lida com isso retornando rapidamente e enviando respostas de forma proativa, mas respostas muito lentas ainda podem causar problemas.

### Formatação

O markdown do Teams é mais limitado que o do Slack ou Discord:

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
- `channels.msteams.dangerouslyAllowNameMatching`: alternância de emergência para reativar correspondência mutável de UPN/nome de exibição e roteamento direto por nome de time/canal.
- `channels.msteams.textChunkLimit`: tamanho do bloco de texto de saída.
- `channels.msteams.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- `channels.msteams.mediaAllowHosts`: lista de permissões para hosts de anexos recebidos (usa domínios Microsoft/Teams por padrão).
- `channels.msteams.mediaAuthAllowHosts`: lista de permissões para anexar cabeçalhos Authorization em novas tentativas de mídia (usa hosts Graph + Bot Framework por padrão).
- `channels.msteams.requireMention`: exige @menção em canais/grupos (padrão true).
- `channels.msteams.replyStyle`: `thread | top-level` (consulte [Estilo de resposta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: substituição por time.
- `channels.msteams.teams.<teamId>.requireMention`: substituição por time.
- `channels.msteams.teams.<teamId>.tools`: substituições padrão de política de ferramenta por time (`allow`/`deny`/`alsoAllow`) usadas quando uma substituição de canal está ausente.
- `channels.msteams.teams.<teamId>.toolsBySender`: substituições padrão de política de ferramenta por remetente dentro do time (`"*"` curinga compatível).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: substituições de política de ferramenta por canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: substituições de política de ferramenta por remetente dentro do canal (`"*"` curinga compatível).
- As chaves `toolsBySender` devem usar prefixos explícitos:
  `id:`, `e164:`, `username:`, `name:` (chaves legadas sem prefixo ainda são mapeadas apenas para `id:`).
- `channels.msteams.actions.memberInfo`: ativa ou desativa a ação de informações de membro com suporte do Graph (padrão: ativada quando as credenciais do Graph estão disponíveis).
- `channels.msteams.authType`: tipo de autenticação — `"secret"` (padrão) ou `"federated"`.
- `channels.msteams.certificatePath`: caminho para o arquivo de certificado PEM (federated + autenticação por certificado).
- `channels.msteams.certificateThumbprint`: impressão digital do certificado (opcional, não obrigatória para autenticação).
- `channels.msteams.useManagedIdentity`: ativa autenticação por identidade gerenciada (modo federated).
- `channels.msteams.managedIdentityClientId`: client ID da identidade gerenciada atribuída pelo usuário.
- `channels.msteams.sharePointSiteId`: ID do site do SharePoint para uploads de arquivos em chats/canais de grupo (consulte [Enviando arquivos em chats em grupo](#sending-files-in-group-chats)).

## Roteamento e sessões

- As chaves de sessão seguem o formato padrão do agente (consulte [/concepts/session](/pt-BR/concepts/session)):
  - Mensagens diretas compartilham a sessão principal (`agent:<agentId>:<mainKey>`).
  - Mensagens de canal/grupo usam o ID da conversa:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de resposta: tópicos vs publicações

O Teams introduziu recentemente dois estilos de interface para canais sobre o mesmo modelo de dados subjacente:

| Estilo                   | Descrição                                                 | `replyStyle` recomendado |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (clássico)     | As mensagens aparecem como cartões com respostas em tópico abaixo | `thread` (padrão)       |
| **Threads** (tipo Slack) | As mensagens fluem linearmente, mais parecido com o Slack | `top-level`              |

**O problema:** a API do Teams não informa qual estilo de interface um canal usa. Se você usar o `replyStyle` errado:

- `thread` em um canal no estilo Threads → as respostas aparecem aninhadas de forma estranha
- `top-level` em um canal no estilo Posts → as respostas aparecem como publicações separadas no nível superior em vez de no tópico

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
- **Canais/grupos:** anexos ficam no armazenamento M365 (SharePoint/OneDrive). A carga útil do webhook inclui apenas um stub HTML, não os bytes reais do arquivo. **Permissões de API do Graph são obrigatórias** para baixar anexos de canal.
- Para envios explícitos com arquivo em primeiro lugar, use `action=upload-file` com `media` / `filePath` / `path`; `message` opcional se torna o texto/comentário que acompanha, e `filename` substitui o nome enviado.

Sem permissões do Graph, mensagens de canal com imagens serão recebidas apenas como texto (o conteúdo da imagem não fica acessível ao bot).
Por padrão, o OpenClaw baixa mídia apenas de nomes de host Microsoft/Teams. Substitua com `channels.msteams.mediaAllowHosts` (use `["*"]` para permitir qualquer host).
Cabeçalhos Authorization só são anexados para hosts em `channels.msteams.mediaAuthAllowHosts` (padrão: hosts do Graph + Bot Framework). Mantenha esta lista restrita (evite sufixos multilocatário).

## Enviando arquivos em chats em grupo

Bots podem enviar arquivos em DMs usando o fluxo FileConsentCard (integrado). No entanto, **enviar arquivos em chats/canais de grupo** exige configuração adicional:

| Contexto                 | Como os arquivos são enviados                | Configuração necessária                         |
| ------------------------ | -------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → usuário aceita → bot envia | Funciona imediatamente                          |
| **Chats/canais de grupo**| Upload para SharePoint → compartilhar link   | Exige `sharePointSiteId` + permissões do Graph |
| **Imagens (qualquer contexto)** | Inline codificado em Base64          | Funciona imediatamente                          |

### Por que chats em grupo precisam de SharePoint

Bots não têm um drive pessoal do OneDrive (o endpoint `/me/drive` da Graph API não funciona para identidades de aplicativo). Para enviar arquivos em chats/canais de grupo, o bot faz upload para um **site do SharePoint** e cria um link de compartilhamento.

### Configuração

1. **Adicione permissões de Graph API** em Entra ID (Azure AD) → App Registration:
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
         // ... other config ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportamento de compartilhamento

| Permissão                              | Comportamento de compartilhamento                      |
| -------------------------------------- | ------------------------------------------------------ |
| `Sites.ReadWrite.All` apenas           | Link de compartilhamento para toda a organização (qualquer pessoa da organização pode acessar) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link de compartilhamento por usuário (somente membros do chat podem acessar) |

O compartilhamento por usuário é mais seguro, pois somente os participantes do chat podem acessar o arquivo. Se a permissão `Chat.Read.All` estiver ausente, o bot recorre ao compartilhamento para toda a organização.

### Comportamento de fallback

| Cenário                                           | Resultado                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Chat em grupo + arquivo + `sharePointSiteId` configurado | Upload para o SharePoint, enviar link de compartilhamento |
| Chat em grupo + arquivo + sem `sharePointSiteId` | Tentar upload no OneDrive (pode falhar), enviar somente texto |
| Chat pessoal + arquivo                            | Fluxo FileConsentCard (funciona sem SharePoint)    |
| Qualquer contexto + imagem                        | Inline codificado em Base64 (funciona sem SharePoint)   |

### Local de armazenamento dos arquivos

Os arquivos enviados são armazenados em uma pasta `/OpenClawShared/` na biblioteca de documentos padrão do site do SharePoint configurado.

## Enquetes (Adaptive Cards)

O OpenClaw envia enquetes do Teams como Adaptive Cards (não existe API nativa de enquete no Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Os votos são registrados pelo gateway em `~/.openclaw/msteams-polls.json`.
- O gateway precisa permanecer online para registrar votos.
- As enquetes ainda não publicam automaticamente resumos de resultados (inspecione o arquivo de armazenamento se necessário).

## Cartões de apresentação

Envie cargas úteis de apresentação semântica para usuários ou conversas do Teams usando a ferramenta `message` ou a CLI. O OpenClaw as renderiza como Adaptive Cards do Teams a partir do contrato genérico de apresentação.

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

Para detalhes sobre o formato de destino, consulte [Formatos de destino](#target-formats) abaixo.

## Formatos de destino

Destinos do MSTeams usam prefixos para distinguir usuários de conversas:

| Tipo de destino         | Formato                         | Exemplo                                             |
| ----------------------- | ------------------------------- | --------------------------------------------------- |
| Usuário (por ID)        | `user:<aad-object-id>`          | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Usuário (por nome)      | `user:<display-name>`           | `user:John Smith` (exige Graph API)                 |
| Grupo/canal             | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`           |
| Grupo/canal (bruto)     | `<conversation-id>`             | `19:abc123...@thread.tacv2` (se contiver `@thread`) |

**Exemplos de CLI:**

```bash
# Enviar para um usuário por ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Enviar para um usuário por nome de exibição (aciona busca pela Graph API)
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

Observação: sem o prefixo `user:`, nomes usam por padrão a resolução de grupo/time. Sempre use `user:` ao direcionar pessoas pelo nome de exibição.

## Mensagens proativas

- Mensagens proativas só são possíveis **depois** que um usuário interagiu, porque armazenamos referências de conversa nesse momento.
- Consulte `/gateway/configuration` para `dmPolicy` e controle por lista de permissões.

## IDs de time e canal (pegadinha comum)

O parâmetro de consulta `groupId` nas URLs do Teams **NÃO** é o ID do time usado para configuração. Extraia os IDs do caminho da URL:

**URL do time:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID do time (decodifique esta URL)
```

**URL do canal:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID do canal (decodifique esta URL)
```

**Para configuração:**

- ID do time = segmento do caminho após `/team/` (URL decodificada, por exemplo, `19:Bk4j...@thread.tacv2`)
- ID do canal = segmento do caminho após `/channel/` (URL decodificada)
- **Ignore** o parâmetro de consulta `groupId`

## Canais privados

Bots têm suporte limitado em canais privados:

| Recurso                      | Canais padrão     | Canais privados       |
| ---------------------------- | ----------------- | --------------------- |
| Instalação do bot            | Sim               | Limitado              |
| Mensagens em tempo real (webhook) | Sim         | Pode não funcionar    |
| Permissões RSC               | Sim               | Podem se comportar de forma diferente |
| @menções                     | Sim               | Se o bot estiver acessível |
| Histórico pela Graph API     | Sim               | Sim (com permissões)  |

**Soluções alternativas se canais privados não funcionarem:**

1. Use canais padrão para interações com o bot
2. Use DMs - os usuários sempre podem enviar mensagem ao bot diretamente
3. Use a Graph API para acesso histórico (exige `ChannelMessage.Read.All`)

## Solução de problemas

### Problemas comuns

- **Imagens não aparecem em canais:** faltam permissões do Graph ou consentimento de administrador. Reinstale o aplicativo do Teams e encerre/reabra totalmente o Teams.
- **Sem respostas no canal:** menções são obrigatórias por padrão; defina `channels.msteams.requireMention=false` ou configure por time/canal.
- **Incompatibilidade de versão (o Teams ainda mostra o manifesto antigo):** remova + adicione o aplicativo novamente e encerre totalmente o Teams para atualizar.
- **401 Unauthorized do webhook:** esperado ao testar manualmente sem Azure JWT - significa que o endpoint está acessível, mas a autenticação falhou. Use Azure Web Chat para testar corretamente.

### Erros de upload do manifesto

- **"Icon file cannot be empty":** o manifesto referencia arquivos de ícone com 0 bytes. Crie ícones PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** o aplicativo ainda está instalado em outro time/chat. Encontre e desinstale-o primeiro, ou espere 5-10 minutos pela propagação.
- **"Something went wrong" no upload:** faça o upload por [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), abra o DevTools do navegador (F12) → aba Network e verifique o corpo da resposta para ver o erro real.
- **Falha no sideload:** tente "Upload an app to your org's app catalog" em vez de "Upload a custom app" - isso geralmente contorna restrições de sideload.

### Permissões RSC não funcionam

1. Verifique se `webApplicationInfo.id` corresponde exatamente ao App ID do seu bot
2. Reenvie o aplicativo e reinstale no time/chat
3. Verifique se o administrador da sua organização bloqueou permissões RSC
4. Confirme se você está usando o escopo correto: `ChannelMessage.Read.Group` para times, `ChatMessage.Read.Chat` para chats em grupo

## Referências

- [Create Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guia de configuração do Azure Bot
- [Teams Developer Portal](https://dev.teams.microsoft.com/apps) - criar/gerenciar aplicativos do Teams
- [Teams app manifest schema](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receive channel messages with RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [RSC permissions reference](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Teams bot file handling](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo exige Graph)
- [Proactive messaging](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - Teams CLI para gerenciamento de bots

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e exigência de menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
