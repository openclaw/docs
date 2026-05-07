---
read_when:
    - Trabalhando em recursos do canal do Microsoft Teams
summary: Status de suporte, recursos e configuração do bot do Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-05-07T13:13:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2fa2aff4d957a59f694cf37d9a4e5ad6b7ee18004d84cbaf8d7ac1aa16860090
    source_path: channels/msteams.md
    workflow: 16
---

Status: há suporte para texto + anexos de DM; o envio de arquivos em canais/grupos exige `sharePointSiteId` + permissões do Graph (consulte [Envio de arquivos em chats em grupo](#sending-files-in-group-chats)). Enquetes são enviadas por Adaptive Cards. As ações de mensagem expõem `upload-file` explícito para envios com arquivo primeiro.

## Plugin integrado

Microsoft Teams é distribuído como um Plugin integrado nas versões atuais do OpenClaw, portanto nenhuma instalação separada é necessária na compilação empacotada normal.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o Teams integrado, instale o pacote npm diretamente:

```bash
openclaw plugins install @openclaw/msteams
```

Use o pacote sem versão para acompanhar a tag de versão oficial atual. Fixe uma versão exata somente quando precisar de uma instalação reproduzível.

Checkout local (ao executar de um repositório git):

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

Instale e autentique a CLI devtunnel se ainda não tiver feito isso ([guia de introdução](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# One-time setup (persistent URL across sessions):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Each dev session:
devtunnel host my-openclaw-bot
# Your endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` é obrigatório porque o Teams não consegue autenticar com devtunnels. Cada solicitação de bot recebida ainda é validada automaticamente pelo SDK do Teams.
</Note>

Alternativas: `ngrok http 3978` ou `tailscale funnel 3978` (mas elas podem mudar URLs a cada sessão).

**3. Crie o aplicativo**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Este único comando:

- Cria um aplicativo Entra ID (Azure AD)
- Gera um segredo de cliente
- Cria e carrega um manifesto de aplicativo do Teams (com ícones)
- Registra o bot (gerenciado pelo Teams por padrão - nenhuma assinatura do Azure é necessária)

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

`teams app create` solicitará que você instale o aplicativo - selecione "Install in Teams". Se você pulou essa etapa, pode obter o link depois:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifique se tudo funciona**

```bash
teams app doctor <teamsAppId>
```

Isso executa diagnósticos em registro de bot, configuração do aplicativo AAD, validade do manifesto e configuração de SSO.

Para implantações de produção, considere usar [autenticação federada](/pt-BR/channels/msteams#federated-authentication-certificate-plus-managed-identity) (certificado ou identidade gerenciada) em vez de segredos de cliente.

<Note>
Chats em grupo são bloqueados por padrão (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respostas em grupo, defina `channels.msteams.groupAllowFrom` ou use `groupPolicy: "open"` para permitir qualquer membro (controlado por menção).
</Note>

## Objetivos

- Falar com o OpenClaw via DMs, chats em grupo ou canais do Teams.
- Manter o roteamento determinístico: as respostas sempre voltam para o canal em que chegaram.
- Usar por padrão um comportamento de canal seguro (menções obrigatórias, a menos que configurado de outra forma).

## Gravações de configuração

Por padrão, Microsoft Teams tem permissão para gravar atualizações de configuração acionadas por `/config set|unset` (exige `commands.config: true`).

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
- Não dependa de correspondência por UPN/nome de exibição para allowlists - eles podem mudar. O OpenClaw desativa a correspondência direta por nome por padrão; habilite explicitamente com `channels.msteams.dangerouslyAllowNameMatching: true`.
- O assistente pode resolver nomes para IDs via Microsoft Graph quando as credenciais permitem.

**Acesso em grupo**

- Padrão: `channels.msteams.groupPolicy = "allowlist"` (bloqueado, a menos que você adicione `groupAllowFrom`). Use `channels.defaults.groupPolicy` para substituir o padrão quando não definido.
- `channels.msteams.groupAllowFrom` controla quais remetentes podem acionar em chats em grupo/canais (recorre a `channels.msteams.allowFrom`).
- Defina `groupPolicy: "open"` para permitir qualquer membro (ainda controlado por menção por padrão).
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

**Teams + allowlist de canais**

- Escopo de respostas de grupo/canal listando equipes e canais em `channels.msteams.teams`.
- As chaves devem usar IDs de conversa estáveis do Teams obtidos de links do Teams, não nomes de exibição mutáveis.
- Quando `groupPolicy="allowlist"` e uma allowlist de equipes estiver presente, somente as equipes/canais listados serão aceitos (controlado por menção).
- O assistente de configuração aceita entradas `Team/Channel` e as armazena para você.
- Na inicialização, o OpenClaw resolve nomes de allowlist de equipe/canal e usuário para IDs (quando as permissões do Graph permitem) e registra o mapeamento; nomes de equipe/canal não resolvidos são mantidos como digitados, mas ignorados para roteamento por padrão, a menos que `channels.msteams.dangerouslyAllowNameMatching: true` esteja habilitado.

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

Se você não puder usar a Teams CLI, poderá configurar o bot manualmente pelo Azure Portal.

### Como funciona

1. Certifique-se de que o Plugin do Microsoft Teams esteja disponível (integrado nas versões atuais).
2. Crie um **Azure Bot** (ID do aplicativo + segredo + ID do locatário).
3. Crie um **pacote de aplicativo Teams** que referencia o bot e inclui as permissões RSC abaixo.
4. Carregue/instale o aplicativo Teams em uma equipe (ou escopo pessoal para DMs).
5. Configure `msteams` em `~/.openclaw/openclaw.json` (ou variáveis de ambiente) e inicie o Gateway.
6. O Gateway escuta tráfego de Webhook do Bot Framework em `/api/messages` por padrão.

### Etapa 1: Criar Azure Bot

1. Acesse [Criar Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Preencha a guia **Basics**:

   | Campo              | Valor                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nome do seu bot, por exemplo, `openclaw-msteams` (deve ser único) |
   | **Subscription**   | Selecione sua assinatura do Azure                        |
   | **Resource group** | Crie um novo ou use um existente                         |
   | **Pricing tier**   | **Free** para desenvolvimento/testes                     |
   | **Type of App**    | **Single Tenant** (recomendado - veja a observação abaixo) |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
A criação de novos bots multilocatário foi descontinuada após 2025-07-31. Use **Single Tenant** para novos bots.
</Warning>

3. Clique em **Review + create** → **Create** (aguarde cerca de 1-2 minutos)

### Etapa 2: Obter credenciais

1. Acesse seu recurso Azure Bot → **Configuration**
2. Copie **Microsoft App ID** → este é seu `appId`
3. Clique em **Manage Password** → acesse o App Registration
4. Em **Certificates & secrets** → **New client secret** → copie o **Value** → este é seu `appPassword`
5. Acesse **Overview** → copie **Directory (tenant) ID** → este é seu `tenantId`

### Etapa 3: Configurar o endpoint de mensagens

1. No Azure Bot → **Configuration**
2. Defina **Messaging endpoint** como a URL do seu Webhook:
   - Produção: `https://your-domain.com/api/messages`
   - Desenvolvimento local: use um túnel (consulte [Desenvolvimento local](#local-development-tunneling) abaixo)

### Etapa 4: Habilitar canal do Teams

1. No Azure Bot → **Channels**
2. Clique em **Microsoft Teams** → Configure → Save
3. Aceite os Termos de Serviço

### Etapa 5: Criar manifesto do aplicativo Teams

- Inclua uma entrada `bot` com `botId = <App ID>`.
- Escopos: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (obrigatório para manipulação de arquivos no escopo pessoal).
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

Use um certificado PEM registrado no registro de aplicativo Entra ID.

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

### Opção B: Identidade Gerenciada do Azure

Use Identidade Gerenciada do Azure para autenticação sem senha. Isso é ideal para implantações em infraestrutura do Azure (AKS, App Service, VMs do Azure) onde uma identidade gerenciada está disponível.

**Como funciona:**

1. O pod/VM do bot tem uma identidade gerenciada (atribuída pelo sistema ou atribuída pelo usuário).
2. Uma **credencial de identidade federada** vincula a identidade gerenciada ao registro de aplicativo Entra ID.
3. Em tempo de execução, o OpenClaw usa `@azure/identity` para adquirir tokens do endpoint Azure IMDS (`169.254.169.254`).
4. O token é passado para o SDK do Teams para autenticação do bot.

**Pré-requisitos:**

- Infraestrutura do Azure com identidade gerenciada habilitada (identidade de carga de trabalho do AKS, App Service, VM)
- Credencial de identidade federada criada no registro de aplicativo Entra ID
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

3. **Anote a conta de serviço do Kubernetes** com o ID de cliente do aplicativo:

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

5. **Garanta acesso de rede** ao IMDS (`169.254.169.254`) - se estiver usando NetworkPolicy, adicione uma regra de egresso permitindo tráfego para `169.254.169.254/32` na porta 80.

### Comparação de tipos de autenticação

| Método                    | Configuração                                   | Vantagens                            | Desvantagens                                    |
| ------------------------- | ---------------------------------------------- | ------------------------------------ | ----------------------------------------------- |
| **Segredo do cliente**    | `appPassword`                                  | Configuração simples                 | Rotação de segredo obrigatória, menos seguro    |
| **Certificado**           | `authType: "federated"` + `certificatePath`    | Nenhum segredo compartilhado na rede | Sobrecarga de gerenciamento de certificados     |
| **Identidade gerenciada** | `authType: "federated"` + `useManagedIdentity` | Sem senha, sem segredos para gerenciar | Infraestrutura do Azure obrigatória             |

**Comportamento padrão:** Quando `authType` não está definido, o OpenClaw usa autenticação por segredo do cliente por padrão. Configurações existentes continuam funcionando sem alterações.

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

## Testando o Bot

**Execute diagnósticos:**

```bash
teams app doctor <teamsAppId>
```

Verifica o registro do bot, o aplicativo AAD, o manifesto e a configuração de SSO em uma única passagem.

**Envie uma mensagem de teste:**

1. Instale o aplicativo Teams (use o link de instalação de `teams app get <id> --install-link`)
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

O OpenClaw expõe uma ação `member-info` baseada no Graph para Microsoft Teams, para que agentes e automações possam resolver detalhes de membros do canal (nome de exibição, email, função) diretamente do Microsoft Graph.

Requisitos:

- Permissão RSC `Member.Read.Group` (já incluída no manifesto recomendado)
- Para consultas entre equipes: permissão de aplicativo do Graph `User.Read.All` com consentimento de administrador

A ação é controlada por `channels.msteams.actions.memberInfo` (padrão: habilitada quando credenciais do Graph estão disponíveis).

## Contexto do histórico

- `channels.msteams.historyLimit` controla quantas mensagens recentes de canal/grupo são envolvidas no prompt.
- Recua para `messages.groupChat.historyLimit`. Defina `0` para desabilitar (padrão 50).
- O histórico de thread buscado é filtrado por listas de remetentes permitidos (`allowFrom` / `groupAllowFrom`), portanto a inicialização de contexto da thread inclui apenas mensagens de remetentes permitidos.
- O contexto de anexo citado (`ReplyTo*` derivado do HTML de resposta do Teams) atualmente é passado como recebido.
- Em outras palavras, as listas de permissão controlam quem pode acionar o agente; apenas caminhos específicos de contexto suplementar são filtrados hoje.
- O histórico de DM pode ser limitado com `channels.msteams.dmHistoryLimit` (turnos do usuário). Substituições por usuário: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permissões RSC atuais do Teams (manifesto)

Estas são as **permissões resourceSpecific existentes** no manifesto do nosso aplicativo Teams. Elas se aplicam somente dentro da equipe/chat em que o aplicativo está instalado.

**Para canais (escopo de equipe):**

- `ChannelMessage.Read.Group` (Application) - receber todas as mensagens do canal sem @menção
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Para chats em grupo:**

- `ChatMessage.Read.Chat` (Application) - receber todas as mensagens de chat em grupo sem @menção

Para adicionar permissões RSC pela CLI do Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Exemplo de manifesto do Teams (redigido)

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
- `bots[].scopes` deve incluir as superfícies que você pretende usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` é obrigatório para manipulação de arquivos no escopo pessoal.
- `authorization.permissions.resourceSpecific` deve incluir leitura/envio de canal se você quiser tráfego de canal.

### Atualizando um aplicativo existente

Para atualizar um aplicativo Teams já instalado (por exemplo, para adicionar permissões RSC):

```bash
# Download, edit, and re-upload the manifest
teams app manifest download <teamsAppId> manifest.json
# Edit manifest.json locally...
teams app manifest upload manifest.json <teamsAppId>
# Version is auto-bumped if content changed
```

Depois de atualizar, reinstale o aplicativo em cada equipe para que as novas permissões entrem em vigor e **encerre totalmente e reinicie o Teams** (não apenas feche a janela) para limpar os metadados do aplicativo em cache.

<details>
<summary>Atualização manual do manifesto (sem CLI)</summary>

1. Atualize seu `manifest.json` com as novas configurações
2. **Incremente o campo `version`** (por exemplo, `1.0.0` → `1.1.0`)
3. **Recompacte** o manifesto com ícones (`manifest.json`, `outline.png`, `color.png`)
4. Faça upload do novo zip:
   - **Centro de Administração do Teams:** Aplicativos do Teams → Gerenciar aplicativos → encontre seu aplicativo → Fazer upload de nova versão
   - **Sideload:** No Teams → Aplicativos → Gerenciar seus aplicativos → Fazer upload de um aplicativo personalizado

</details>

## Capacidades: somente RSC vs Graph

### Com **somente Teams RSC** (aplicativo instalado, sem permissões da Graph API)

Funciona:

- Ler conteúdo de **texto** de mensagens de canal.
- Enviar conteúdo de **texto** para mensagens de canal.
- Receber anexos de arquivo **pessoais (DM)**.

Não funciona:

- **Conteúdo de imagens ou arquivos** de canal/grupo (o payload inclui apenas stub HTML).
- Baixar anexos armazenados no SharePoint/OneDrive.
- Ler histórico de mensagens (além do evento de Webhook em tempo real).

### Com **Teams RSC + permissões de aplicativo do Microsoft Graph**

Adiciona:

- Download de conteúdos hospedados (imagens coladas em mensagens).
- Download de anexos de arquivo armazenados no SharePoint/OneDrive.
- Leitura de histórico de mensagens de canal/chat via Graph.

### RSC vs Graph API

| Capacidade                | Permissões RSC      | Graph API                                      |
| ------------------------- | ------------------- | ---------------------------------------------- |
| **Mensagens em tempo real** | Sim (via Webhook)   | Não (somente polling)                          |
| **Mensagens históricas**  | Não                 | Sim (pode consultar histórico)                 |
| **Complexidade de configuração** | Somente manifesto do app | Requer consentimento de administrador + fluxo de token |
| **Funciona offline**      | Não (deve estar em execução) | Sim (consulta a qualquer momento)        |

**Resumo:** RSC é para escuta em tempo real; Graph API é para acesso histórico. Para recuperar mensagens perdidas enquanto estava offline, você precisa da Graph API com `ChannelMessage.Read.All` (requer consentimento de administrador).

## Mídia + histórico habilitados por Graph (obrigatório para canais)

Se você precisa de imagens/arquivos em **canais** ou quer buscar **histórico de mensagens**, deve habilitar permissões do Microsoft Graph e conceder consentimento de administrador.

1. Em **Registro de Aplicativo** do Entra ID (Azure AD), adicione permissões de **aplicativo** do Microsoft Graph:
   - `ChannelMessage.Read.All` (anexos de canal + histórico)
   - `Chat.Read.All` ou `ChatMessage.Read.All` (chats em grupo)
2. **Conceda consentimento de administrador** para o locatário.
3. Incremente a **versão do manifesto** do aplicativo Teams, faça novo upload e **reinstale o aplicativo no Teams**.
4. **Encerre totalmente e reinicie o Teams** para limpar os metadados do aplicativo em cache.

**Permissão adicional para menções a usuários:** Menções @ a usuários funcionam imediatamente para usuários na conversa. No entanto, se você quiser pesquisar dinamicamente e mencionar usuários que **não estão na conversa atual**, adicione a permissão `User.Read.All` (Application) e conceda consentimento de administrador.

## Limitações conhecidas

### Timeouts de Webhook

O Teams entrega mensagens via Webhook HTTP. Se o processamento demorar demais (por exemplo, respostas lentas de LLM), você pode ver:

- Timeouts do Gateway
- O Teams tentando reenviar a mensagem (causando duplicatas)
- Respostas descartadas

O OpenClaw lida com isso retornando rapidamente e enviando respostas proativamente, mas respostas muito lentas ainda podem causar problemas.

### Formatação

O markdown do Teams é mais limitado que o do Slack ou Discord:

- A formatação básica funciona: **negrito**, _itálico_, `code`, links
- Markdown complexo (tabelas, listas aninhadas) pode não ser renderizado corretamente
- Adaptive Cards são compatíveis com enquetes e envios de apresentação semântica (veja abaixo)

## Configuração

Configurações principais (veja `/gateway/configuration` para padrões compartilhados de canais):

- `channels.msteams.enabled`: habilita/desabilita o canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenciais do bot.
- `channels.msteams.webhook.port` (padrão `3978`)
- `channels.msteams.webhook.path` (padrão `/api/messages`)
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing)
- `channels.msteams.allowFrom`: lista de permissões de DM (IDs de objeto AAD recomendados). O assistente resolve nomes para IDs durante a configuração quando o acesso ao Graph está disponível.
- `channels.msteams.dangerouslyAllowNameMatching`: alternância de emergência para reativar correspondência mutável de UPN/nome de exibição e roteamento direto por nome de equipe/canal.
- `channels.msteams.textChunkLimit`: tamanho de fragmento de texto de saída.
- `channels.msteams.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da fragmentação por tamanho.
- `channels.msteams.mediaAllowHosts`: lista de permissões para hosts de anexos recebidos (o padrão são domínios Microsoft/Teams).
- `channels.msteams.mediaAuthAllowHosts`: lista de permissões para anexar cabeçalhos Authorization em novas tentativas de mídia (o padrão são hosts Graph + Bot Framework).
- `channels.msteams.requireMention`: exige @menção em canais/grupos (padrão true).
- `channels.msteams.replyStyle`: `thread | top-level` (veja [Estilo de resposta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: substituição por equipe.
- `channels.msteams.teams.<teamId>.requireMention`: substituição por equipe.
- `channels.msteams.teams.<teamId>.tools`: substituições padrão por equipe da política de ferramentas (`allow`/`deny`/`alsoAllow`) usadas quando não há substituição de canal.
- `channels.msteams.teams.<teamId>.toolsBySender`: substituições padrão por equipe e por remetente da política de ferramentas (curinga `"*"` compatível).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: substituições por canal da política de ferramentas (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: substituições por canal e por remetente da política de ferramentas (curinga `"*"` compatível).
- As chaves `toolsBySender` devem usar prefixos explícitos:
  `id:`, `e164:`, `username:`, `name:` (chaves legadas sem prefixo ainda são mapeadas apenas para `id:`).
- `channels.msteams.actions.memberInfo`: habilita ou desabilita a ação de informações de membro baseada no Graph (padrão: habilitada quando credenciais do Graph estão disponíveis).
- `channels.msteams.authType`: tipo de autenticação - `"secret"` (padrão) ou `"federated"`.
- `channels.msteams.certificatePath`: caminho para o arquivo de certificado PEM (autenticação federada + certificado).
- `channels.msteams.certificateThumbprint`: impressão digital do certificado (opcional, não obrigatória para autenticação).
- `channels.msteams.useManagedIdentity`: habilita autenticação por identidade gerenciada (modo federado).
- `channels.msteams.managedIdentityClientId`: ID do cliente para identidade gerenciada atribuída pelo usuário.
- `channels.msteams.sharePointSiteId`: ID do site SharePoint para uploads de arquivos em chats em grupo/canais (veja [Envio de arquivos em chats em grupo](#sending-files-in-group-chats)).

## Roteamento e sessões

- As chaves de sessão seguem o formato padrão de agente (veja [/concepts/session](/pt-BR/concepts/session)):
  - Mensagens diretas compartilham a sessão principal (`agent:<agentId>:<mainKey>`).
  - Mensagens de canal/grupo usam o ID da conversa:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de resposta: threads vs publicações

Teams introduziu recentemente dois estilos de interface de canal sobre o mesmo modelo de dados subjacente:

| Estilo                   | Descrição                                                 | `replyStyle` recomendado |
| ------------------------ | --------------------------------------------------------- | ------------------------ |
| **Publicações** (clássico) | As mensagens aparecem como cartões com respostas em thread abaixo | `thread` (padrão)        |
| **Threads** (estilo Slack) | As mensagens fluem linearmente, mais parecido com Slack   | `top-level`              |

**O problema:** A API do Teams não expõe qual estilo de interface um canal usa. Se você usar o `replyStyle` errado:

- `thread` em um canal no estilo Threads → as respostas aparecem aninhadas de forma estranha
- `top-level` em um canal no estilo Publicações → as respostas aparecem como publicações de nível superior separadas em vez de dentro da thread

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

Se você definir `requireMention: false` globalmente sem um `replyStyle` explícito, menções em canais no estilo Publicações aparecerão como publicações de nível superior mesmo quando a entrada foi uma resposta em thread. Fixe `replyStyle: "thread"` no nível global, de equipe ou de canal para evitar surpresas.

### Preservação do contexto da thread

Quando `replyStyle: "thread"` está em vigor e o bot foi @mencionado de dentro de uma thread de canal, o OpenClaw reanexa a raiz da thread original à referência de conversa de saída (`19:…@thread.tacv2;messageid=<root>`) para que a resposta chegue à mesma thread. Isso vale tanto para envios ao vivo (no turno) quanto para envios proativos feitos depois que o contexto de turno do Bot Framework expirou (por exemplo, agentes de longa duração, respostas de chamadas de ferramentas enfileiradas via `mcp__openclaw__message`).

A raiz da thread é obtida do `threadId` armazenado na referência de conversa. Referências armazenadas mais antigas, anteriores a `threadId`, recorrem a `activityId` (qualquer atividade recebida que tenha inicializado a conversa por último), então implantações existentes continuam funcionando sem reinicialização.

Quando `replyStyle: "top-level"` está em vigor, entradas de threads de canal são respondidas intencionalmente como novas publicações de nível superior — nenhum sufixo de thread é anexado. Este é o comportamento correto para canais no estilo Threads; se você vir publicações de nível superior onde esperava respostas em thread, seu `replyStyle` está configurado incorretamente para esse canal.

## Anexos e imagens

**Limitações atuais:**

- **DMs:** Imagens e anexos de arquivo funcionam via APIs de arquivo de bot do Teams.
- **Canais/grupos:** Anexos ficam no armazenamento M365 (SharePoint/OneDrive). A carga do Webhook inclui apenas um stub HTML, não os bytes reais do arquivo. **Permissões da Graph API são obrigatórias** para baixar anexos de canal.
- Para envios explícitos com arquivo em primeiro lugar, use `action=upload-file` com `media` / `filePath` / `path`; `message` opcional se torna o texto/comentário acompanhante, e `filename` substitui o nome enviado.

Sem permissões do Graph, mensagens de canal com imagens serão recebidas apenas como texto (o conteúdo da imagem não é acessível ao bot).
Por padrão, o OpenClaw só baixa mídia de nomes de host Microsoft/Teams. Substitua com `channels.msteams.mediaAllowHosts` (use `["*"]` para permitir qualquer host).
Cabeçalhos Authorization só são anexados para hosts em `channels.msteams.mediaAuthAllowHosts` (o padrão são hosts Graph + Bot Framework). Mantenha esta lista restrita (evite sufixos multilocatário).

## Envio de arquivos em chats em grupo

Bots podem enviar arquivos em DMs usando o fluxo FileConsentCard (integrado). No entanto, **enviar arquivos em chats em grupo/canais** exige configuração adicional:

| Contexto                 | Como os arquivos são enviados                  | Configuração necessária                         |
| ------------------------ | ---------------------------------------------- | ----------------------------------------------- |
| **DMs**                  | FileConsentCard → usuário aceita → bot faz upload | Funciona imediatamente                          |
| **Chats em grupo/canais** | Upload para SharePoint → link de compartilhamento | Exige `sharePointSiteId` + permissões do Graph  |
| **Imagens (qualquer contexto)** | Inline codificado em Base64                    | Funciona imediatamente                          |

### Por que chats em grupo precisam do SharePoint

Bots não têm uma unidade pessoal do OneDrive (o endpoint `/me/drive` da Graph API não funciona para identidades de aplicativo). Para enviar arquivos em chats em grupo/canais, o bot faz upload para um **site SharePoint** e cria um link de compartilhamento.

### Configuração

1. **Adicione permissões da Graph API** no Entra ID (Azure AD) → Registro de aplicativo:
   - `Sites.ReadWrite.All` (Aplicativo) - enviar arquivos para o SharePoint
   - `Chat.Read.All` (Aplicativo) - opcional, habilita links de compartilhamento por usuário

2. **Conceda consentimento de administrador** para o locatário.

3. **Obtenha o ID do seu site SharePoint:**

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

| Permissão                               | Comportamento de compartilhamento                         |
| --------------------------------------- | --------------------------------------------------------- |
| Apenas `Sites.ReadWrite.All`            | Link de compartilhamento para toda a organização (qualquer pessoa na organização pode acessar) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link de compartilhamento por usuário (somente membros do chat podem acessar) |

O compartilhamento por usuário é mais seguro, pois somente os participantes do chat podem acessar o arquivo. Se a permissão `Chat.Read.All` estiver ausente, o bot recorre ao compartilhamento para toda a organização.

### Comportamento de fallback

| Cenário                                          | Resultado                                          |
| ------------------------------------------------- | -------------------------------------------------- |
| Chat em grupo + arquivo + `sharePointSiteId` configurado | Upload para SharePoint, envia link de compartilhamento |
| Chat em grupo + arquivo + sem `sharePointSiteId` | Tenta upload para OneDrive (pode falhar), envia apenas texto |
| Chat pessoal + arquivo                           | Fluxo FileConsentCard (funciona sem SharePoint)    |
| Qualquer contexto + imagem                       | Inline codificado em Base64 (funciona sem SharePoint) |

### Local de armazenamento dos arquivos

Arquivos enviados são armazenados em uma pasta `/OpenClawShared/` na biblioteca de documentos padrão do site SharePoint configurado.

## Enquetes (Adaptive Cards)

O OpenClaw envia enquetes do Teams como Adaptive Cards (não há API nativa de enquetes do Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> ...`
- Os votos são registrados pelo Gateway em `~/.openclaw/msteams-polls.json`.
- O Gateway deve permanecer online para registrar votos.
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

Os destinos MSTeams usam prefixos para distinguir entre usuários e conversas:

| Tipo de destino         | Formato                          | Exemplo                                             |
| ----------------------- | -------------------------------- | --------------------------------------------------- |
| Usuário (por ID)        | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`         |
| Usuário (por nome)      | `user:<display-name>`            | `user:John Smith` (requer Graph API)                |
| Grupo/canal             | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`            |
| Grupo/canal (bruto)     | `<conversation-id>`              | `19:abc123...@thread.tacv2` (se contiver `@thread`) |

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

<Note>
Sem o prefixo `user:`, nomes usam resolução de grupo ou equipe por padrão. Sempre use `user:` ao direcionar para pessoas por nome de exibição.
</Note>

## Mensagens proativas

- Mensagens proativas só são possíveis **depois** que um usuário interage, porque armazenamos referências de conversa nesse momento.
- Consulte `/gateway/configuration` para `dmPolicy` e controle por lista de permissões.

## IDs de equipe e canal (armadilha comum)

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

- Chave da equipe = segmento do caminho após `/team/` (decodificado da URL, por exemplo, `19:Bk4j...@thread.tacv2`; tenants mais antigos podem mostrar `@thread.skype`, que também é válido)
- Chave do canal = segmento do caminho após `/channel/` (decodificado da URL)
- **Ignore** o parâmetro de consulta `groupId` para o roteamento do OpenClaw. Ele é o ID do grupo do Microsoft Entra, não o ID de conversa do Bot Framework usado em atividades recebidas do Teams.

## Canais privados

Bots têm suporte limitado em canais privados:

| Recurso                      | Canais padrão | Canais privados             |
| ---------------------------- | ------------- | --------------------------- |
| Instalação do bot            | Sim           | Limitado                    |
| Mensagens em tempo real (Webhook) | Sim      | Pode não funcionar          |
| Permissões RSC               | Sim           | Podem se comportar de forma diferente |
| @menções                     | Sim           | Se o bot estiver acessível  |
| Histórico via Graph API      | Sim           | Sim (com permissões)        |

**Soluções alternativas se canais privados não funcionarem:**

1. Use canais padrão para interações com bots
2. Use DMs - os usuários sempre podem enviar mensagem diretamente para o bot
3. Use Graph API para acesso histórico (requer `ChannelMessage.Read.All`)

## Solução de problemas

### Problemas comuns

- **Imagens não aparecem em canais:** permissões do Graph ou consentimento de administrador ausentes. Reinstale o aplicativo Teams e feche/reabra completamente o Teams.
- **Sem respostas no canal:** menções são obrigatórias por padrão; defina `channels.msteams.requireMention=false` ou configure por equipe/canal.
- **Incompatibilidade de versão (o Teams ainda mostra o manifesto antigo):** remova e adicione o aplicativo novamente, e feche completamente o Teams para atualizar.
- **401 Unauthorized do Webhook:** esperado ao testar manualmente sem Azure JWT - significa que o endpoint está acessível, mas a autenticação falhou. Use o Azure Web Chat para testar corretamente.

### Erros de upload do manifesto

- **"Icon file cannot be empty":** o manifesto referencia arquivos de ícone com 0 bytes. Crie ícones PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** o aplicativo ainda está instalado em outra equipe/chat. Encontre e desinstale-o primeiro, ou aguarde 5-10 minutos pela propagação.
- **"Something went wrong" no upload:** faça upload por [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), abra o DevTools do navegador (F12) → aba Network, e verifique o corpo da resposta para o erro real.
- **Falha no sideload:** tente "Upload an app to your org's app catalog" em vez de "Upload a custom app" - isso frequentemente contorna restrições de sideload.

### Permissões RSC não funcionam

1. Verifique se `webApplicationInfo.id` corresponde exatamente ao App ID do seu bot
2. Faça upload do aplicativo novamente e reinstale-o na equipe/chat
3. Verifique se o administrador da sua organização bloqueou permissões RSC
4. Confirme que você está usando o escopo correto: `ChannelMessage.Read.Group` para equipes, `ChatMessage.Read.Chat` para chats em grupo

## Referências

- [Criar Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guia de configuração do Azure Bot
- [Portal de Desenvolvedores do Teams](https://dev.teams.microsoft.com/apps) - criar/gerenciar aplicativos Teams
- [Esquema de manifesto de aplicativo Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receber mensagens de canal com RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referência de permissões RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Manipulação de arquivos de bot do Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo requer Graph)
- [Mensagens proativas](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI do Teams para gerenciamento de bots

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento de chat em grupo e controle por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e proteção
