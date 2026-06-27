---
read_when:
    - Trabalhando em recursos do canal Microsoft Teams
summary: Status, recursos e configuração do bot do Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-06-27T17:11:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cad5dc92b3a70e85412cbf34c926d7211dce7534c31387744e6f085bcfe23f08
    source_path: channels/msteams.md
    workflow: 16
---

Status: anexos de texto + DM são compatíveis; o envio de arquivos em canal/grupo requer `sharePointSiteId` + permissões do Graph (consulte [Envio de arquivos em chats de grupo](#sending-files-in-group-chats)). Enquetes são enviadas via Adaptive Cards. As ações de mensagem expõem `upload-file` explícito para envios com arquivo primeiro.

## Plugin incluído

Microsoft Teams é fornecido como um Plugin incluído nas versões atuais do OpenClaw, então nenhuma
instalação separada é necessária na compilação empacotada normal.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o Teams incluído,
instale o pacote npm diretamente:

```bash
openclaw plugins install @openclaw/msteams
```

Use o pacote sem versão para acompanhar a tag de lançamento oficial atual. Fixe uma
versão exata somente quando precisar de uma instalação reproduzível.

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

O [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) lida com registro de bot, criação de manifesto e geração de credenciais em um único comando.

**1. Instale e faça login**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verify you're logged in and see your tenant info
```

<Note>
A Teams CLI está atualmente em preview. Comandos e flags podem mudar entre versões.
</Note>

**2. Inicie um túnel** (o Teams não consegue acessar localhost)

Instale e autentique a CLI do devtunnel se ainda não tiver feito isso ([guia de introdução](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` é obrigatório porque o Teams não consegue autenticar com devtunnels. Cada solicitação de bot recebida ainda é validada automaticamente pelo Teams SDK.
</Note>

Alternativas: `ngrok http 3978` ou `tailscale funnel 3978` (mas elas podem alterar URLs a cada sessão).

**3. Crie o aplicativo**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Este único comando:

- Cria um aplicativo Entra ID (Azure AD)
- Gera um segredo de cliente
- Cria e envia um manifesto de aplicativo Teams (com ícones)
- Registra o bot (gerenciado pelo Teams por padrão - nenhuma assinatura do Azure necessária)

A saída mostrará `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` e um **ID do aplicativo Teams** - anote-os para as próximas etapas. Ela também oferece instalar o aplicativo diretamente no Teams.

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

`teams app create` solicitará que você instale o aplicativo - selecione "Instalar no Teams". Se você pulou essa etapa, pode obter o link depois:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifique se tudo funciona**

```bash
teams app doctor <teamsAppId>
```

Isso executa diagnósticos no registro do bot, configuração do aplicativo AAD, validade do manifesto e configuração de SSO.

Para implantações de produção, considere usar [autenticação federada](/pt-BR/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certificado ou identidade gerenciada) em vez de segredos de cliente.

<Note>
Chats de grupo são bloqueados por padrão (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respostas em grupo, defina `channels.msteams.groupAllowFrom`, ou use `groupPolicy: "open"` para permitir qualquer membro (condicionado a menção).
</Note>

## Objetivos

- Conversar com o OpenClaw via DMs, chats de grupo ou canais do Teams.
- Manter o roteamento determinístico: respostas sempre voltam para o canal de onde vieram.
- Usar por padrão um comportamento de canal seguro (menções obrigatórias, salvo configuração em contrário).

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
- `channels.msteams.allowFrom` deve usar IDs de objeto AAD estáveis ou grupos estáticos de acesso de remetentes, como `accessGroup:core-team`.
- Não dependa de correspondência por UPN/nome de exibição para listas de permissões - eles podem mudar. O OpenClaw desativa a correspondência direta de nomes por padrão; habilite explicitamente com `channels.msteams.dangerouslyAllowNameMatching: true`.
- O assistente pode resolver nomes para IDs via Microsoft Graph quando as credenciais permitirem.

**Acesso em grupo**

- Padrão: `channels.msteams.groupPolicy = "allowlist"` (bloqueado, a menos que você adicione `groupAllowFrom`). Use `channels.defaults.groupPolicy` para substituir o padrão quando não definido.
- `channels.msteams.groupAllowFrom` controla quais remetentes ou grupos estáticos de acesso de remetentes podem acionar em chats/canais de grupo (recai para `channels.msteams.allowFrom`).
- Defina `groupPolicy: "open"` para permitir qualquer membro (ainda condicionado a menção por padrão).
- Para permitir **nenhum canal**, defina `channels.msteams.groupPolicy: "disabled"`.

Exemplo:

```json5
{
  channels: {
    msteams: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["00000000-0000-0000-0000-000000000000", "accessGroup:core-team"],
    },
  },
}
```

**Teams + lista de permissões de canais**

- Delimite respostas de grupo/canal listando equipes e canais em `channels.msteams.teams`.
- As chaves devem usar IDs de conversa do Teams estáveis obtidos de links do Teams, não nomes de exibição mutáveis.
- Quando `groupPolicy="allowlist"` e uma lista de permissões de equipes está presente, somente equipes/canais listados são aceitos (condicionados a menção).
- O assistente de configuração aceita entradas `Team/Channel` e as armazena para você.
- Na inicialização, o OpenClaw resolve nomes de equipe/canal e listas de permissões de usuários para IDs (quando as permissões do Graph permitem)
  e registra o mapeamento; nomes de equipe/canal não resolvidos são mantidos como digitados, mas ignorados para roteamento por padrão, a menos que `channels.msteams.dangerouslyAllowNameMatching: true` esteja habilitado.

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
<summary><strong>Configuração manual (sem a Teams CLI)</strong></summary>

Se você não puder usar a Teams CLI, poderá configurar o bot manualmente pelo Portal do Azure.

### Como funciona

1. Garanta que o Plugin do Microsoft Teams esteja disponível (incluído nas versões atuais).
2. Crie um **Azure Bot** (ID do aplicativo + segredo + ID do locatário).
3. Crie um **pacote de aplicativo Teams** que referencia o bot e inclui as permissões RSC abaixo.
4. Envie/instale o aplicativo Teams em uma equipe (ou no escopo pessoal para DMs).
5. Configure `msteams` em `~/.openclaw/openclaw.json` (ou variáveis de ambiente) e inicie o Gateway.
6. O Gateway escuta tráfego de Webhook do Bot Framework em `/api/messages` por padrão.

### Etapa 1: Criar Azure Bot

1. Acesse [Criar Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Preencha a aba **Básico**:

   | Campo              | Valor                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Identificador do bot** | Nome do seu bot, por exemplo, `openclaw-msteams` (deve ser único) |
   | **Assinatura**     | Selecione sua assinatura do Azure                         |
   | **Grupo de recursos** | Crie um novo ou use um existente                       |
   | **Camada de preço** | **Gratuita** para desenvolvimento/testes                |
   | **Tipo de aplicativo** | **Locatário único** (recomendado - consulte a observação abaixo) |
   | **Tipo de criação** | **Criar novo ID de aplicativo Microsoft**               |

<Warning>
A criação de novos bots multilocatário foi descontinuada após 2025-07-31. Use **Locatário único** para novos bots.
</Warning>

3. Clique em **Revisar + criar** → **Criar** (aguarde ~1-2 minutos)

### Etapa 2: Obter credenciais

1. Acesse seu recurso Azure Bot → **Configuração**
2. Copie o **ID do aplicativo Microsoft** → este é seu `appId`
3. Clique em **Gerenciar senha** → acesse o Registro de Aplicativo
4. Em **Certificados e segredos** → **Novo segredo do cliente** → copie o **Valor** → este é seu `appPassword`
5. Acesse **Visão geral** → copie o **ID do diretório (locatário)** → este é seu `tenantId`

### Etapa 3: Configurar endpoint de mensagens

1. Em Azure Bot → **Configuração**
2. Defina **Endpoint de mensagens** como sua URL de Webhook:
   - Produção: `https://your-domain.com/api/messages`
   - Desenvolvimento local: use um túnel (consulte [Desenvolvimento local](#local-development-tunneling) abaixo)

### Etapa 4: Habilitar canal Teams

1. Em Azure Bot → **Canais**
2. Clique em **Microsoft Teams** → Configurar → Salvar
3. Aceite os Termos de Serviço

### Etapa 5: Criar manifesto do aplicativo Teams

- Inclua uma entrada `bot` com `botId = <App ID>`.
- Escopos: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (obrigatório para tratamento de arquivos no escopo pessoal).
- Adicione permissões RSC (consulte [Permissões RSC](#current-teams-rsc-permissions-manifest)).
- Crie ícones: `outline.png` (32x32) e `color.png` (192x192).
- Compacte os três arquivos juntos: `manifest.json`, `outline.png`, `color.png`.

### Etapa 6: Configurar OpenClaw

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

### Etapa 7: Executar o Gateway

O canal Teams inicia automaticamente quando o Plugin está disponível e a configuração `msteams` existe com credenciais.

</details>

## Autenticação federada (certificado mais identidade gerenciada)

> Adicionado em 2026.4.11

Para implantações de produção, o OpenClaw oferece suporte a **autenticação federada** como uma alternativa mais segura a segredos de cliente. Dois métodos estão disponíveis:

### Opção A: Autenticação baseada em certificado

Use um certificado PEM registrado no registro do seu aplicativo Entra ID.

**Configuração:**

1. Gere ou obtenha um certificado (formato PEM com chave privada).
2. Em Entra ID → Registro de Aplicativo → **Certificados e segredos** → **Certificados** → Envie o certificado público.

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

Use Azure Managed Identity para autenticação sem senha. Isso é ideal para implantações em infraestrutura do Azure (AKS, App Service, VMs do Azure) onde uma identidade gerenciada está disponível.

**Como funciona:**

1. O pod/VM do bot tem uma identidade gerenciada (atribuída pelo sistema ou atribuída pelo usuário).
2. Uma **credencial de identidade federada** vincula a identidade gerenciada ao registro do aplicativo Entra ID.
3. Em runtime, o OpenClaw usa `@azure/identity` para adquirir tokens do endpoint IMDS do Azure (`169.254.169.254`).
4. O token é passado ao Teams SDK para autenticação do bot.

**Pré-requisitos:**

- Infraestrutura do Azure com identidade gerenciada habilitada (identidade de workload do AKS, App Service, VM)
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

### Configuração da Identidade de Carga de Trabalho do AKS

Para implantações do AKS usando identidade de carga de trabalho:

1. **Habilite a identidade de carga de trabalho** no seu cluster AKS.
2. **Crie uma credencial de identidade federada** no registro do aplicativo do Entra ID:

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

4. **Rotule o pod** para injeção da identidade de carga de trabalho:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Garanta acesso de rede** ao IMDS (`169.254.169.254`) - se estiver usando NetworkPolicy, adicione uma regra de saída permitindo tráfego para `169.254.169.254/32` na porta 80.

### Comparação de tipos de autenticação

| Método                  | Configuração                                   | Prós                                | Contras                                          |
| ----------------------- | ---------------------------------------------- | ----------------------------------- | ------------------------------------------------ |
| **Segredo do cliente**  | `appPassword`                                  | Configuração simples                | Rotação de segredo obrigatória, menos seguro     |
| **Certificado**         | `authType: "federated"` + `certificatePath`    | Nenhum segredo compartilhado na rede | Sobrecarga de gerenciamento de certificados      |
| **Managed Identity**    | `authType: "federated"` + `useManagedIdentity` | Sem senha, sem segredos para gerenciar | Infraestrutura do Azure obrigatória              |

**Comportamento padrão:** Quando `authType` não é definido, o OpenClaw usa autenticação por segredo do cliente por padrão. As configurações existentes continuam funcionando sem alterações.

## Desenvolvimento local (tunelamento)

O Teams não consegue acessar `localhost`. Use um túnel de desenvolvimento persistente para que sua URL permaneça a mesma entre sessões:

```bash
# One-time setup:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
```

Alternativas: `ngrok http 3978` ou `tailscale funnel 3978` (as URLs podem mudar a cada sessão).

Se a URL do seu túnel mudar, atualize o endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Testando o bot

**Execute os diagnósticos:**

```bash
teams app doctor <teamsAppId>
```

Verifica o registro do bot, o aplicativo AAD, o manifesto e a configuração de SSO em uma única execução.

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
- `MSTEAMS_CERTIFICATE_PATH` (federado + certificado)
- `MSTEAMS_CERTIFICATE_THUMBPRINT` (opcional, não obrigatório para autenticação)
- `MSTEAMS_USE_MANAGED_IDENTITY` (federado + identidade gerenciada)
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` (somente MI atribuída pelo usuário)

## Ação de informações de membro

O OpenClaw expõe uma ação `member-info` baseada no Graph para o Microsoft Teams, para que agentes e automações possam resolver detalhes de membros do canal (nome de exibição, email, função) diretamente pelo Microsoft Graph.

Requisitos:

- Permissão RSC `Member.Read.Group` (já incluída no manifesto recomendado)
- Para consultas entre equipes: permissão de aplicativo Graph `User.Read.All` com consentimento de administrador

A ação é controlada por `channels.msteams.actions.memberInfo` (padrão: habilitada quando as credenciais do Graph estão disponíveis).

## Contexto de histórico

- `channels.msteams.historyLimit` controla quantas mensagens recentes de canal/grupo são incluídas no prompt.
- Recorre a `messages.groupChat.historyLimit`. Defina como `0` para desabilitar (padrão 50).
- O histórico de thread buscado é filtrado por listas de remetentes permitidos (`allowFrom` / `groupAllowFrom`), portanto a semeadura de contexto da thread inclui apenas mensagens de remetentes permitidos.
- O contexto de anexos citados (`ReplyTo*` derivado do HTML de resposta do Teams) atualmente é transmitido como recebido.
- Em outras palavras, as listas de permissão controlam quem pode acionar o agente; hoje, apenas caminhos específicos de contexto suplementar são filtrados.
- O histórico de DM pode ser limitado com `channels.msteams.dmHistoryLimit` (turnos de usuário). Substituições por usuário: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permissões RSC atuais do Teams (manifesto)

Estas são as **permissões resourceSpecific existentes** no manifesto do nosso aplicativo do Teams. Elas se aplicam apenas dentro da equipe/chat onde o aplicativo está instalado.

**Para canais (escopo de equipe):**

- `ChannelMessage.Read.Group` (Application) - receber todas as mensagens do canal sem @menção
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Para chats em grupo:**

- `ChatMessage.Read.Chat` (Application) - receber todas as mensagens do chat em grupo sem @menção

Para adicionar permissões RSC via CLI do Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Exemplo de manifesto do Teams (editado)

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

### Ressalvas do manifesto (campos obrigatórios)

- `bots[].botId` **deve** corresponder ao ID do aplicativo Azure Bot.
- `webApplicationInfo.id` **deve** corresponder ao ID do aplicativo Azure Bot.
- `bots[].scopes` deve incluir as superfícies que você planeja usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` é obrigatório para tratamento de arquivos no escopo pessoal.
- `authorization.permissions.resourceSpecific` deve incluir leitura/envio de canal se você quiser tráfego de canais.

### Atualizando um aplicativo existente

Para atualizar um aplicativo do Teams já instalado (por exemplo, para adicionar permissões RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Depois de atualizar, reinstale o aplicativo em cada equipe para que as novas permissões entrem em vigor e **encerre totalmente e reinicie o Teams** (não apenas feche a janela) para limpar os metadados em cache do aplicativo.

<details>
<summary>Atualização manual do manifesto (sem CLI)</summary>

1. Atualize seu `manifest.json` com as novas configurações
2. **Incremente o campo `version`** (por exemplo, `1.0.0` → `1.1.0`)
3. **Compacte novamente** o manifesto com os ícones (`manifest.json`, `outline.png`, `color.png`)
4. Envie o novo zip:
   - **Centro de Administração do Teams:** Aplicativos do Teams → Gerenciar aplicativos → encontre seu aplicativo → Enviar nova versão
   - **Sideload:** No Teams → Aplicativos → Gerenciar seus aplicativos → Enviar um aplicativo personalizado

</details>

## Capacidades: somente RSC vs Graph

### Com **somente RSC do Teams** (aplicativo instalado, sem permissões de Graph API)

Funciona:

- Ler conteúdo de **texto** de mensagens de canal.
- Enviar conteúdo de **texto** de mensagens de canal.
- Receber anexos de arquivo **pessoais (DM)**.

NÃO funciona:

- **Conteúdo de imagem ou arquivo** em canais/grupos (a carga útil inclui apenas um stub HTML).
- Baixar anexos armazenados no SharePoint/OneDrive.
- Ler histórico de mensagens (além do evento de webhook ao vivo).

### Com **RSC do Teams + permissões de Aplicativo do Microsoft Graph**

Adiciona:

- Download de conteúdos hospedados (imagens coladas em mensagens).
- Download de anexos de arquivo armazenados no SharePoint/OneDrive.
- Leitura do histórico de mensagens de canais/chats via Graph.

### RSC vs Graph API

| Capacidade                | Permissões RSC        | Graph API                                         |
| ------------------------- | --------------------- | ------------------------------------------------- |
| **Mensagens em tempo real** | Sim (via webhook)     | Não (somente polling)                            |
| **Mensagens históricas**  | Não                   | Sim (pode consultar o histórico)                 |
| **Complexidade de configuração** | Apenas manifesto do aplicativo | Requer consentimento de administrador + fluxo de token |
| **Funciona offline**      | Não (deve estar em execução) | Sim (consulte a qualquer momento)          |

**Resumo:** RSC serve para escuta em tempo real; Graph API serve para acesso histórico. Para recuperar mensagens perdidas enquanto offline, você precisa de Graph API com `ChannelMessage.Read.All` (requer consentimento de administrador).

## Mídia + histórico habilitados pelo Graph (obrigatório para canais)

Se você precisa de imagens/arquivos em **canais** ou quer buscar **histórico de mensagens**, deve habilitar permissões do Microsoft Graph e conceder consentimento de administrador.

1. No **Registro de Aplicativo** do Entra ID (Azure AD), adicione permissões de **Aplicativo** do Microsoft Graph:
   - `ChannelMessage.Read.All` (anexos de canal + histórico)
   - `Chat.Read.All` ou `ChatMessage.Read.All` (chats em grupo)
2. **Conceda consentimento de administrador** para o tenant.
3. Incremente a **versão do manifesto** do aplicativo do Teams, envie novamente e **reinstale o aplicativo no Teams**.
4. **Encerre totalmente e reinicie o Teams** para limpar os metadados em cache do aplicativo.

**Permissão adicional para menções a usuários:** Menções @ a usuários funcionam automaticamente para usuários na conversa. No entanto, se você quiser pesquisar e mencionar dinamicamente usuários que **não estão na conversa atual**, adicione a permissão `User.Read.All` (Application) e conceda consentimento de administrador.

## Limitações conhecidas

### Timeouts de webhook

O Teams entrega mensagens via webhook HTTP. Se o processamento demorar demais (por exemplo, respostas lentas de LLM), você pode ver:

- Timeouts do Gateway
- O Teams repetindo a mensagem (causando duplicatas)
- Respostas descartadas

OpenClaw lida com isso retornando rapidamente e enviando respostas de forma proativa, mas respostas muito lentas ainda podem causar problemas.

### Suporte a nuvens do Teams e URL de serviço

Este caminho do Teams com suporte do SDK é validado ao vivo para a nuvem pública do Microsoft Teams.

Respostas de entrada usam o contexto de turno recebido do Teams SDK. Operações proativas fora de contexto - envios, edições, exclusões, cartões, enquetes, mensagens de consentimento de arquivo e respostas longas enfileiradas - usam o `serviceUrl` armazenado na referência de conversa. A nuvem pública usa por padrão o ambiente de nuvem pública do Teams SDK e permite referências armazenadas no host público do Teams Connector: `https://smba.trafficmanager.net/`.

A nuvem pública é o padrão. Você não precisa definir `channels.msteams.cloud` ou `channels.msteams.serviceUrl` para bots normais de nuvem pública.

Para nuvens não públicas do Teams, defina `cloud` e o limite proativo correspondente quando a Microsoft publicar um:

- `channels.msteams.cloud` seleciona a predefinição de nuvem do Teams SDK para autenticação, validação de JWT, serviços de token e escopo do Graph.
- `channels.msteams.serviceUrl` seleciona o limite do endpoint do Bot Connector usado para validar referências de conversa armazenadas antes de envios, edições, exclusões, cartões, enquetes, mensagens de consentimento de arquivo e respostas longas enfileiradas proativas. Ele é obrigatório para nuvens SDK USGov e DoD. Para China/21Vianet, o OpenClaw usa a predefinição `China` do SDK e aceita URLs de serviço armazenadas/configuradas somente em hosts de canal do Azure China Bot Framework.

A Microsoft publica os endpoints globais proativos do Bot Connector na seção [Criar a conversa](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) da documentação de mensagens proativas do Teams. Use o `serviceUrl` da atividade recebida quando disponível; se você precisar de um endpoint proativo global, use a tabela da Microsoft.

| Ambiente do Teams | Configuração do OpenClaw                                  | `serviceUrl` proativo                              |
| ----------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| Público           | nenhuma configuração de cloud/serviceUrl necessária        | `https://smba.trafficmanager.net/teams`            |
| GCC               | defina `serviceUrl`; não existe uma predefinição de nuvem separada do Teams SDK | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                            | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                         | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                           | use o `serviceUrl` da atividade recebida           |

Exemplo para GCC, em que a Microsoft documenta uma URL de serviço proativa separada, mas o Teams SDK não expõe uma predefinição de nuvem GCC separada:

```json
{
  "channels": {
    "msteams": {
      "serviceUrl": "https://smba.infra.gcc.teams.microsoft.com/teams"
    }
  }
}
```

Exemplo para GCC High:

```json
{
  "channels": {
    "msteams": {
      "cloud": "USGov",
      "serviceUrl": "https://smba.infra.gov.teams.microsoft.us/teams"
    }
  }
}
```

`channels.msteams.serviceUrl` é restrito a hosts do Microsoft Teams Bot Connector com suporte. Quando uma URL de serviço é configurada, o OpenClaw verifica se o `serviceUrl` da conversa armazenada usa o mesmo host antes de envios, edições, exclusões, cartões, enquetes ou respostas longas enfileiradas proativas serem executados. Com a configuração padrão de nuvem pública, o OpenClaw falha de forma fechada se uma conversa armazenada apontar para fora do host público do Teams Connector. Receba uma nova mensagem da conversa depois de alterar as configurações de nuvem/URL de serviço para que a referência de conversa armazenada esteja atualizada.

China/21Vianet não tem uma URL `smba` proativa global separada na tabela de endpoints proativos do Teams da Microsoft. Configure `cloud: "China"` para que o Teams SDK use endpoints de autenticação, token e JWT do Azure China. Envios proativos então exigem uma referência de conversa armazenada de uma atividade recebida do Teams da China, ou uma URL de serviço configurada explicitamente, no limite do canal Azure China Bot Framework (`*.botframework.azure.cn`). Auxiliares do Teams com suporte do Graph estão atualmente desativados para `cloud: "China"` até que o OpenClaw encaminhe solicitações do Graph pelo endpoint do Azure China Graph.

### Formatação

O markdown do Teams é mais limitado que o do Slack ou Discord:

- A formatação básica funciona: **negrito**, _itálico_, `code`, links
- Markdown complexo (tabelas, listas aninhadas) pode não ser renderizado corretamente
- Adaptive Cards têm suporte para enquetes e envios de apresentação semântica (veja abaixo)

## Configuração

Configurações principais (veja `/gateway/configuration` para padrões de canais compartilhados):

- `channels.msteams.enabled`: habilita/desabilita o canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenciais do bot.
- `channels.msteams.cloud`: ambiente de nuvem do Teams SDK (`Public`, `USGov`, `USGovDoD` ou `China`; padrão `Public`). Defina isto com `serviceUrl` para nuvens SDK USGov/DoD; China usa a predefinição do SDK e referências de conversa armazenadas do Azure China Bot Framework, com auxiliares baseados no Graph desativados até que o roteamento do Azure China Graph seja implementado.
- `channels.msteams.serviceUrl`: limite da URL de serviço do Bot Connector para operações proativas do SDK. A nuvem pública usa o padrão do SDK; defina isto para GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High ou DoD. China aceita hosts de canal do Azure China Bot Framework quando a referência de conversa armazenada vem do Teams operado pela 21Vianet.
- `channels.msteams.webhook.port` (padrão `3978`)
- `channels.msteams.webhook.path` (padrão `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing)
- `channels.msteams.allowFrom`: lista de permissões de DM (IDs de objeto AAD recomendados). O assistente resolve nomes para IDs durante a configuração quando o acesso ao Graph está disponível.
- `channels.msteams.dangerouslyAllowNameMatching`: alternância de emergência para reabilitar correspondência mutável de UPN/nome de exibição e roteamento direto por nome de equipe/canal.
- `channels.msteams.textChunkLimit`: tamanho do fragmento de texto de saída.
- `channels.msteams.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da divisão por comprimento.
- `channels.msteams.mediaAllowHosts`: lista de permissões para hosts de anexos de entrada (o padrão são domínios Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: lista de permissões para anexar cabeçalhos Authorization em novas tentativas de mídia (o padrão são hosts Graph + Bot Framework).
- `channels.msteams.requireMention`: exige @mention em canais/grupos (padrão true).
- `channels.msteams.replyStyle`: `thread | top-level` (veja [Estilo de resposta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: substituição por equipe.
- `channels.msteams.teams.<teamId>.requireMention`: substituição por equipe.
- `channels.msteams.teams.<teamId>.tools`: substituições padrão de política de ferramentas por equipe (`allow`/`deny`/`alsoAllow`) usadas quando uma substituição de canal está ausente.
- `channels.msteams.teams.<teamId>.toolsBySender`: substituições padrão de política de ferramentas por equipe e remetente (curinga `"*"` compatível).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: substituições de política de ferramentas por canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: substituições de política de ferramentas por canal e remetente (curinga `"*"` compatível).
- As chaves de `toolsBySender` devem usar prefixos explícitos:
  `channel:`, `id:`, `e164:`, `username:`, `name:` (chaves legadas sem prefixo ainda mapeiam apenas para `id:`).
- `channels.msteams.actions.memberInfo`: habilita ou desabilita a ação de informações de membro baseada no Graph (padrão: habilitada quando credenciais do Graph estão disponíveis).
- `channels.msteams.authType`: tipo de autenticação - `"secret"` (padrão) ou `"federated"`.
- `channels.msteams.certificatePath`: caminho para o arquivo de certificado PEM (autenticação federada + certificado).
- `channels.msteams.certificateThumbprint`: impressão digital do certificado (opcional, não obrigatória para autenticação).
- `channels.msteams.useManagedIdentity`: habilita autenticação por identidade gerenciada (modo federado).
- `channels.msteams.managedIdentityClientId`: ID do cliente para identidade gerenciada atribuída pelo usuário.
- `channels.msteams.sharePointSiteId`: ID do site do SharePoint para uploads de arquivos em chats/canais de grupo (veja [Enviando arquivos em chats de grupo](#sending-files-in-group-chats)).

## Roteamento e sessões

- As chaves de sessão seguem o formato padrão de agente (veja [/concepts/session](/pt-BR/concepts/session)):
  - Mensagens diretas compartilham a sessão principal (`agent:<agentId>:<mainKey>`).
  - Mensagens de canal/grupo usam o id da conversa:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de resposta: threads vs posts

O Teams introduziu recentemente dois estilos de interface de canal sobre o mesmo modelo de dados subjacente:

| Estilo                   | Descrição                                                 | `replyStyle` recomendado |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Posts** (clássico)     | Mensagens aparecem como cartões com respostas em thread abaixo | `thread` (padrão)        |
| **Threads** (semelhante ao Slack) | Mensagens fluem linearmente, mais como no Slack     | `top-level`              |

**O problema:** A API do Teams não expõe qual estilo de interface um canal usa. Se você usar o `replyStyle` errado:

- `thread` em um canal no estilo Threads → respostas aparecem aninhadas de forma estranha
- `top-level` em um canal no estilo Posts → respostas aparecem como posts separados de nível superior em vez de dentro da thread

**Solução:** Configure `replyStyle` por canal com base em como o canal está configurado:

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

### Precedência de resolução

Quando o bot envia uma resposta para um canal, `replyStyle` é resolvido da substituição mais específica até o padrão. O primeiro valor que não seja `undefined` vence:

1. **Por canal** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Por equipe** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** — `channels.msteams.replyStyle`
4. **Padrão implícito** — derivado de `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Se você definir `requireMention: false` globalmente sem um `replyStyle` explícito, menções em canais no estilo Posts aparecerão como posts de nível superior mesmo quando a entrada foi uma resposta em thread. Fixe `replyStyle: "thread"` no nível global, de equipe ou de canal para evitar surpresas.

### Preservação do contexto da thread

Quando `replyStyle: "thread"` está em vigor e o bot foi @mencionado dentro de uma thread de canal, o OpenClaw reanexa a raiz original da thread à referência de conversa de saída (`19:…@thread.tacv2;messageid=<root>`) para que a resposta caia dentro da mesma thread. Isso vale tanto para envios ao vivo (durante o turno) quanto para envios proativos feitos depois que o contexto de turno do Bot Framework expirou (por exemplo, agentes de longa execução, respostas enfileiradas de chamadas de ferramentas via `mcp__openclaw__message`).

A raiz da thread é obtida do `threadId` armazenado na referência de conversa. Referências armazenadas mais antigas que antecedem `threadId` recorrem a `activityId` (qualquer atividade de entrada que tenha semeado a conversa por último), então implantações existentes continuam funcionando sem uma nova semeadura.

Quando `replyStyle: "top-level"` está em vigor, entradas de thread de canal são respondidas intencionalmente como novas publicações de nível superior — nenhum sufixo de thread é anexado. Esse é o comportamento correto para canais no estilo Threads; se você vê publicações de nível superior onde esperava respostas em thread, seu `replyStyle` está configurado incorretamente para esse canal.

## Anexos e imagens

**Limitações atuais:**

- **DMs:** Imagens e anexos de arquivo funcionam por meio das APIs de arquivo de bot do Teams.
- **Canais/grupos:** Os anexos ficam no armazenamento M365 (SharePoint/OneDrive). A carga útil do Webhook inclui apenas um stub HTML, não os bytes reais do arquivo. **Permissões da Graph API são necessárias** para baixar anexos de canal.
- Para envios explícitos com arquivo primeiro, use `action=upload-file` com `media` / `filePath` / `path`; `message` opcional vira o texto/comentário acompanhante, e `filename` substitui o nome enviado.

Sem permissões do Graph, mensagens de canal com imagens serão recebidas apenas como texto (o conteúdo da imagem não é acessível ao bot).
Por padrão, o OpenClaw só baixa mídia de nomes de host Microsoft/Teams. Substitua com `channels.msteams.mediaAllowHosts` (use `["*"]` para permitir qualquer host).
Cabeçalhos de autorização só são anexados para hosts em `channels.msteams.mediaAuthAllowHosts` (o padrão é Graph + hosts do Bot Framework). Mantenha esta lista restrita (evite sufixos multilocatário).

## Enviando arquivos em chats em grupo

Bots podem enviar arquivos em DMs usando o fluxo FileConsentCard (integrado). No entanto, **enviar arquivos em chats em grupo/canais** exige configuração adicional:

| Contexto                 | Como os arquivos são enviados               | Configuração necessária                         |
| ------------------------ | ------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → usuário aceita → bot envia | Funciona sem configuração adicional             |
| **Chats em grupo/canais** | Upload para SharePoint → link de compartilhamento | Exige `sharePointSiteId` + permissões do Graph |
| **Imagens (qualquer contexto)** | Inline codificado em Base64                  | Funciona sem configuração adicional             |

### Por que chats em grupo precisam do SharePoint

Bots não têm uma unidade pessoal do OneDrive (o endpoint `/me/drive` da Graph API não funciona para identidades de aplicativo). Para enviar arquivos em chats em grupo/canais, o bot faz upload para um **site do SharePoint** e cria um link de compartilhamento.

### Configuração

1. **Adicione permissões da Graph API** no Entra ID (Azure AD) → Registro de aplicativo:
   - `Sites.ReadWrite.All` (Application) - enviar arquivos para o SharePoint
   - `Chat.Read.All` (Application) - opcional, habilita links de compartilhamento por usuário

2. **Conceda consentimento de administrador** para o locatário.

3. **Obtenha o ID do seu site do SharePoint:**

   ```bash
   # Via Graph Explorer or curl with a valid token:
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/{hostname}:/{site-path}"

   # Example: for a site at "contoso.sharepoint.com/sites/BotFiles"
   curl -H "Authorization: Bearer $TOKEN" \
     "https://graph.microsoft.com/v1.0/sites/contoso.sharepoint.com:/sites/BotFiles"

   # Response includes: "id": "contoso.sharepoint.com,guid1,guid2"
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

| Permissão                              | Comportamento de compartilhamento                     |
| -------------------------------------- | ----------------------------------------------------- |
| Apenas `Sites.ReadWrite.All`           | Link de compartilhamento para toda a organização (qualquer pessoa na organização pode acessar) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link de compartilhamento por usuário (somente membros do chat podem acessar) |

O compartilhamento por usuário é mais seguro, pois somente os participantes do chat podem acessar o arquivo. Se a permissão `Chat.Read.All` estiver ausente, o bot faz fallback para compartilhamento para toda a organização.

### Comportamento de fallback

| Cenário                                          | Resultado                                          |
| ------------------------------------------------ | -------------------------------------------------- |
| Chat em grupo + arquivo + `sharePointSiteId` configurado | Upload para SharePoint, envia link de compartilhamento |
| Chat em grupo + arquivo + sem `sharePointSiteId` | Tenta upload para OneDrive (pode falhar), envia apenas texto |
| Chat pessoal + arquivo                           | Fluxo FileConsentCard (funciona sem SharePoint)    |
| Qualquer contexto + imagem                       | Inline codificado em Base64 (funciona sem SharePoint) |

### Local dos arquivos armazenados

Arquivos enviados são armazenados em uma pasta `/OpenClawShared/` na biblioteca de documentos padrão do site do SharePoint configurado.

## Enquetes (Adaptive Cards)

O OpenClaw envia enquetes do Teams como Adaptive Cards (não há API nativa de enquetes do Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Os votos são registrados pelo gateway no SQLite de estado de Plugin do OpenClaw em `state/openclaw.sqlite`.
- Arquivos `msteams-polls.json` existentes são importados por `openclaw doctor --fix`, não pelo Plugin em execução.
- O gateway deve permanecer online para registrar votos.
- As enquetes ainda não publicam resumos de resultados automaticamente, e ainda não há CLI de resultados de enquete compatível.

## Cartões de apresentação

Envie cargas úteis semânticas de apresentação para usuários ou conversas do Teams usando a ferramenta `message`, a CLI ou a entrega normal de resposta. O OpenClaw as renderiza como Adaptive Cards do Teams a partir do contrato genérico de apresentação.

O parâmetro `presentation` aceita blocos semânticos. Quando `presentation` é fornecido, o texto da mensagem é opcional. Botões são renderizados como ações de envio ou URL de Adaptive Card. Menus de seleção ainda não são nativos no renderizador do Teams, então o OpenClaw os rebaixa para texto legível antes da entrega.

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

Para detalhes do formato de destino, veja [Formatos de destino](#target-formats) abaixo.

## Formatos de destino

Destinos MSTeams usam prefixos para distinguir entre usuários e conversas:

| Tipo de destino     | Formato                          | Exemplo                                             |
| ------------------- | -------------------------------- | --------------------------------------------------- |
| Usuário (por ID)    | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Usuário (por nome)  | `user:<display-name>`            | `user:John Smith` (exige Graph API)                 |
| Grupo/canal         | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grupo/canal (bruto) | `<conversation-id>`              | `19:abc123...@thread.tacv2` (se contiver `@thread`) |

**Exemplos de CLI:**

```bash
# Send to a user by ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Send to a user by display name (triggers Graph API lookup)
openclaw message send --channel msteams --target "user:John Smith" --message "Hello"

# Send to a group chat or channel
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Hello"

# Send a presentation card to a conversation
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

<Note>
Sem o prefixo `user:`, nomes usam por padrão a resolução de grupo ou equipe. Sempre use `user:` ao direcionar para pessoas pelo nome de exibição.
</Note>

## Mensagens proativas

- Mensagens proativas só são possíveis **depois** que um usuário interagiu, porque armazenamos referências de conversa nesse momento.
- Veja `/gateway/configuration` para `dmPolicy` e controle por lista de permissões.

## IDs de equipe e canal (pegadinha comum)

O parâmetro de consulta `groupId` em URLs do Teams **NÃO** é o ID da equipe usado para configuração. Extraia os IDs do caminho da URL em vez disso:

**URL da equipe:**

```
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    Team conversation ID (URL-decode this)
```

**URL do canal:**

```
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      Channel ID (URL-decode this)
```

**Para configuração:**

- Chave da equipe = segmento do caminho após `/team/` (decodificado de URL, por exemplo, `19:Bk4j...@thread.tacv2`; locatários mais antigos podem mostrar `@thread.skype`, que também é válido)
- Chave do canal = segmento do caminho após `/channel/` (decodificado de URL)
- **Ignore** o parâmetro de consulta `groupId` para roteamento do OpenClaw. Ele é o ID de grupo do Microsoft Entra, não o ID de conversa do Bot Framework usado nas atividades recebidas do Teams.

## Canais privados

Bots têm suporte limitado em canais privados:

| Recurso                      | Canais padrão | Canais privados            |
| ---------------------------- | ------------- | -------------------------- |
| Instalação do bot            | Sim           | Limitada                   |
| Mensagens em tempo real (Webhook) | Sim      | Pode não funcionar         |
| Permissões RSC               | Sim           | Podem se comportar de forma diferente |
| @menções                     | Sim           | Se o bot estiver acessível |
| Histórico da Graph API       | Sim           | Sim (com permissões)       |

**Soluções alternativas se canais privados não funcionarem:**

1. Use canais padrão para interações com o bot
2. Use DMs - usuários sempre podem enviar mensagem diretamente ao bot
3. Use a Graph API para acesso histórico (exige `ChannelMessage.Read.All`)

## Solução de problemas

### Problemas comuns

- **Imagens não aparecem em canais:** Permissões do Graph ou consentimento de administrador ausentes. Reinstale o aplicativo Teams e feche/reabra totalmente o Teams.
- **Sem respostas no canal:** menções são obrigatórias por padrão; defina `channels.msteams.requireMention=false` ou configure por equipe/canal.
- **Incompatibilidade de versão (Teams ainda mostra manifesto antigo):** remova + readicione o aplicativo e feche totalmente o Teams para atualizar.
- **401 Unauthorized do Webhook:** Esperado ao testar manualmente sem JWT do Azure - significa que o endpoint está acessível, mas a autenticação falhou. Use o Azure Web Chat para testar corretamente.

### Erros de upload de manifesto

- **"Icon file cannot be empty":** O manifesto referencia arquivos de ícone com 0 bytes. Crie ícones PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** O aplicativo ainda está instalado em outra equipe/chat. Encontre-o e desinstale-o primeiro, ou aguarde 5-10 minutos para propagação.
- **"Something went wrong" no upload:** Em vez disso, faça upload por [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), abra o DevTools do navegador (F12) → aba Network e verifique o corpo da resposta para o erro real.
- **Falha no sideload:** Tente "Upload an app to your org's app catalog" em vez de "Upload a custom app" - isso geralmente contorna restrições de sideload.

### Permissões RSC não funcionando

1. Verifique se `webApplicationInfo.id` corresponde exatamente ao App ID do seu bot
2. Reenvie o app e reinstale-o na equipe/no chat
3. Verifique se o administrador da sua organização bloqueou as permissões RSC
4. Confirme que você está usando o escopo correto: `ChannelMessage.Read.Group` para equipes, `ChatMessage.Read.Chat` para chats em grupo

## Referências

- [Criar Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guia de configuração do Azure Bot
- [Portal do Desenvolvedor do Teams](https://dev.teams.microsoft.com/apps) - crie/gerencie apps do Teams
- [Esquema de manifesto de app do Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receber mensagens de canal com RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referência de permissões RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Manipulação de arquivos de bot do Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo requer Graph)
- [Mensagens proativas](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI do Teams para gerenciamento de bots

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e hardening
