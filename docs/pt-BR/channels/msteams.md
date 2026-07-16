---
read_when:
    - Trabalhando em recursos do canal do Microsoft Teams
summary: Status, recursos e configuração do bot do Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-16T12:12:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: cb16cf89ed2ab7ae69389ac30e9cc32cc7d1bc2d3c6bccbd139d367380b7b32c
    source_path: channels/msteams.md
    workflow: 16
---

Status: há suporte a texto + anexos em mensagens diretas; o envio de arquivos em canais/grupos requer `sharePointSiteId` + permissões do Graph (consulte [Envio de arquivos em chats em grupo](#sending-files-in-group-chats)). As enquetes são enviadas por meio de Adaptive Cards. As ações de mensagem expõem `upload-file` explícito para envios que priorizam arquivos.

## Plugin incluído

O Microsoft Teams é fornecido como um plugin incluído nas versões atuais do OpenClaw; nenhuma instalação separada é necessária na compilação empacotada normal.

Em uma compilação mais antiga ou em uma instalação personalizada que exclua o Teams incluído, instale o pacote npm diretamente:

```bash
openclaw plugins install @openclaw/msteams
```

Use o pacote sem especificar versão para acompanhar a tag da versão oficial atual. Fixe uma versão exata somente quando precisar de uma instalação reproduzível.

Checkout local (execução a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

[`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) gerencia o registro do bot, a criação do manifesto e a geração de credenciais em um único comando.

**1. Instale e faça login**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verifique se você está conectado e consulte as informações do seu locatário
```

<Note>
A CLI do Teams está atualmente em versão prévia. Os comandos e sinalizadores podem mudar entre as versões.
</Note>

**2. Inicie um túnel** (o Teams não consegue acessar localhost)

Se necessário, instale e autentique a CLI devtunnel ([guia de introdução](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Configuração única (URL persistente entre sessões):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# A cada sessão de desenvolvimento:
devtunnel host my-openclaw-bot
# Seu endpoint: https://<tunnel-id>.devtunnels.ms/api/messages
```

<Note>
`--allow-anonymous` é obrigatório porque o Teams não consegue se autenticar com devtunnels. Cada solicitação recebida pelo bot ainda é validada pelo SDK do Teams.
</Note>

Alternativas: `ngrok http 3978` ou `tailscale funnel 3978` (as URLs podem mudar a cada sessão).

**3. Crie o aplicativo**

```bash
teams app create \
  --name "OpenClaw" \
  --endpoint "https://<your-tunnel-url>/api/messages"
```

Isso cria um aplicativo do Entra ID (Azure AD), gera um segredo do cliente, compila e carrega um manifesto de aplicativo do Teams (com ícones) e registra um bot gerenciado pelo Teams (sem necessidade de assinatura do Azure). A saída inclui `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` e uma **ID do aplicativo do Teams**; ela também oferece a opção de instalar o aplicativo diretamente no Teams.

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

Ou use diretamente as variáveis de ambiente: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

**5. Instale o aplicativo no Teams**

`teams app create` solicita que você instale o aplicativo; selecione "Install in Teams". Para obter o link de instalação posteriormente:

```bash
teams app get <teamsAppId> --install-link
```

**6. Verifique se tudo funciona**

```bash
teams app doctor <teamsAppId>
```

Executa diagnósticos do registro do bot, da configuração do aplicativo AAD, da validade do manifesto e da configuração de SSO.

Para produção, considere a [autenticação federada](#federated-authentication-certificate-plus-managed-identity) (certificado ou identidade gerenciada) em vez de segredos do cliente.

<Note>
Os chats em grupo são bloqueados por padrão (`channels.msteams.groupPolicy: "allowlist"`). Para permitir respostas em grupo, defina `channels.msteams.groupAllowFrom` ou use `groupPolicy: "open"` para permitir qualquer membro (com exigência de menção).
</Note>

## Objetivos

- Converse com o OpenClaw por meio de mensagens diretas, chats em grupo ou canais do Teams.
- Mantenha o roteamento determinístico: as respostas sempre retornam ao canal de origem.
- Use por padrão um comportamento seguro nos canais (menções obrigatórias, salvo configuração em contrário).

## Gravações de configuração

Por padrão, o Microsoft Teams pode gravar atualizações de configuração acionadas por `/config set|unset` (requer `commands.config: true`).

Desative com:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Controle de acesso (mensagens diretas + grupos)

**Acesso a mensagens diretas**

- Padrão: `channels.msteams.dmPolicy = "pairing"`. Remetentes desconhecidos são ignorados até serem aprovados.
- `channels.msteams.allowFrom` deve usar IDs de objeto AAD estáveis ou grupos estáticos de acesso de remetentes, como `accessGroup:core-team`.
- Não dependa da correspondência por UPN/nome de exibição para listas de permissões; eles podem mudar. O OpenClaw desativa por padrão a correspondência direta por nome; habilite-a com `channels.msteams.dangerouslyAllowNameMatching: true`.
- O assistente pode resolver nomes em IDs por meio do Microsoft Graph quando as credenciais permitirem.

**Acesso de grupos**

- Padrão: `channels.msteams.groupPolicy = "allowlist"` (bloqueado, a menos que você adicione `groupAllowFrom`). `channels.defaults.groupPolicy` pode substituir o padrão compartilhado quando `channels.msteams.groupPolicy` não estiver definido.
- `channels.msteams.groupAllowFrom` controla quais remetentes ou grupos estáticos de acesso de remetentes podem acionar o bot em chats em grupo/canais (usa `channels.msteams.allowFrom` como alternativa).
- Defina `groupPolicy: "open"` para permitir qualquer membro (a exigência de menção continua ativa por padrão).
- Para bloquear **todos** os canais, defina `channels.msteams.groupPolicy: "disabled"`.

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

**Lista de permissões de equipes + canais**

- Restrinja as respostas em grupos/canais listando equipes e canais em `channels.msteams.teams`.
- Use como chaves IDs de conversa estáveis do Teams obtidos dos links do Teams, e não nomes de exibição mutáveis (consulte [IDs de equipe e canal](#team-and-channel-ids-common-gotcha)).
- Quando `groupPolicy="allowlist"` e uma lista de permissões de equipes estiverem presentes, somente as equipes/os canais listados serão aceitos (com exigência de menção).
- O assistente de configuração aceita entradas `Team/Channel` e as armazena para você.
- Na inicialização, o OpenClaw resolve nomes de equipes/canais e de listas de permissões de usuários em IDs (quando as permissões do Graph permitem) e registra o mapeamento. Nomes não resolvidos são mantidos como digitados, mas ignorados para fins de roteamento, a menos que `channels.msteams.dangerouslyAllowNameMatching: true` esteja definido.

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
<summary><strong>Configuração manual (sem a CLI do Teams)</strong></summary>

### Como funciona

1. Certifique-se de que o plugin do Microsoft Teams esteja disponível (incluído nas versões atuais).
2. Crie um **Azure Bot** (ID do aplicativo + segredo + ID do locatário).
3. Crie um **pacote de aplicativo do Teams** que faça referência ao bot, incluindo as permissões RSC abaixo.
4. Carregue/instale o aplicativo do Teams em uma equipe (ou no escopo pessoal para mensagens diretas).
5. Configure `msteams` em `~/.openclaw/openclaw.json` (ou nas variáveis de ambiente) e inicie o Gateway.
6. Por padrão, o Gateway escuta o tráfego do Webhook do Bot Framework em `/api/messages`.

### Etapa 1: Criar o Azure Bot

1. Acesse [Create Azure Bot](https://portal.azure.com/#create/Microsoft.AzureBot)
2. Preencha a guia **Basics**:

   | Campo              | Valor                                                    |
   | ------------------ | -------------------------------------------------------- |
   | **Bot handle**     | Nome do seu bot, por exemplo, `openclaw-msteams` (deve ser exclusivo) |
   | **Subscription**   | Selecione sua assinatura do Azure                        |
   | **Resource group** | Crie um novo ou use um existente                         |
   | **Pricing tier**   | **Free** para desenvolvimento/testes                     |
   | **Type of App**    | **Single Tenant** (recomendado; consulte a observação abaixo) |
   | **Creation type**  | **Create new Microsoft App ID**                          |

<Warning>
A criação de novos bots multilocatário foi descontinuada após 2025-07-31. Use **Single Tenant** para novos bots.
</Warning>

3. Clique em **Review + create** e depois em **Create** (~1-2 minutos).

### Etapa 2: Obter credenciais

1. Recurso do Azure Bot → **Configuration** → copie **Microsoft App ID** (seu `appId`).
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → copie o **Value** (seu `appPassword`).
3. **Overview** → copie **Directory (tenant) ID** (seu `tenantId`).

### Etapa 3: Configurar o endpoint de mensagens

1. Azure Bot → **Configuration**.
2. Defina **Messaging endpoint**:
   - Produção: `https://your-domain.com/api/messages`
   - Desenvolvimento local: use um túnel (consulte [Desenvolvimento local](#local-development-tunneling))

### Etapa 4: Habilitar o canal do Teams

1. Azure Bot → **Channels**.
2. Clique em **Microsoft Teams** → Configure → Save.
3. Aceite os Terms of Service.

### Etapa 5: Criar o manifesto do aplicativo do Teams

- Inclua uma entrada `bot` com `botId = <App ID>`.
- Escopos: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (obrigatório para o processamento de arquivos no escopo pessoal).
- Adicione permissões RSC (consulte [Permissões RSC](#current-teams-rsc-permissions-manifest)).
- Crie os ícones: `outline.png` (32x32) e `color.png` (192x192).
- Compacte `manifest.json`, `outline.png` e `color.png` juntos.

### Etapa 6: Configurar o OpenClaw

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

O canal do Teams é iniciado automaticamente quando o plugin está disponível e a configuração `msteams` contém credenciais.

</details>

## Autenticação federada (certificado mais identidade gerenciada)

Para produção, o OpenClaw oferece suporte à **autenticação federada** como alternativa aos segredos do cliente, por meio de `channels.msteams.authType: "federated"`. Há dois métodos:

### Opção A: Autenticação baseada em certificado

Use um certificado PEM registrado no registro do seu aplicativo do Entra ID.

**Configuração:**

1. Gere ou obtenha um certificado (formato PEM com chave privada).
2. Entra ID → App Registration → **Certificates & secrets** → **Certificates** → carregue o certificado público.

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

Use a Identidade Gerenciada do Azure para autenticação sem senha na infraestrutura do Azure (AKS, App Service, VMs do Azure).

**Como funciona:**

1. O pod/a VM do bot tem uma identidade gerenciada (atribuída pelo sistema ou pelo usuário).
2. Uma credencial de identidade federada vincula a identidade gerenciada ao registro do aplicativo do Entra ID.
3. Em tempo de execução, o OpenClaw usa `@azure/identity` para adquirir tokens do endpoint IMDS do Azure.
4. O token é passado ao SDK do Teams para autenticação do bot.

**Pré-requisitos:**

- Infraestrutura do Azure com identidade gerenciada habilitada (identidade de carga de trabalho do AKS, App Service, VM).
- Credencial de identidade federada criada no registro de aplicativo do Entra ID.
- Acesso de rede ao IMDS (`169.254.169.254:80`) a partir do pod/VM.

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

**Configuração (identidade gerenciada atribuída pelo usuário):** adicione `managedIdentityClientId: "<MI_CLIENT_ID>"` ao bloco acima.

**Variáveis de ambiente:**

- `MSTEAMS_AUTH_TYPE=federated`
- `MSTEAMS_USE_MANAGED_IDENTITY=true`
- `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID=<client-id>` (somente atribuída pelo usuário)

### Configuração da identidade de carga de trabalho do AKS

Para implantações do AKS que usam identidade de carga de trabalho:

1. **Habilite a identidade de carga de trabalho** no cluster do AKS.
2. **Crie uma credencial de identidade federada** no registro de aplicativo do Entra ID:

   ```bash
   az ad app federated-credential create --id <APP_OBJECT_ID> --parameters '{
     "name": "my-bot-workload-identity",
     "issuer": "<AKS_OIDC_ISSUER_URL>",
     "subject": "system:serviceaccount:<NAMESPACE>:<SERVICE_ACCOUNT>",
     "audiences": ["api://AzureADTokenExchange"]
   }'
   ```

3. **Anote a conta de serviço do Kubernetes** com a ID de cliente do aplicativo:

   ```yaml
   apiVersion: v1
   kind: ServiceAccount
   metadata:
     name: my-bot-sa
     annotations:
       azure.workload.identity/client-id: "<APP_CLIENT_ID>"
   ```

4. **Adicione um rótulo ao pod** para a injeção da identidade de carga de trabalho:

   ```yaml
   metadata:
     labels:
       azure.workload.identity/use: "true"
   ```

5. **Permita o acesso de rede** ao IMDS (`169.254.169.254`): se estiver usando NetworkPolicy, adicione uma regra de saída para `169.254.169.254/32` na porta 80.

### Comparação dos tipos de autenticação

| Método                  | Configuração                                    | Vantagens                                   | Desvantagens                                       |
| ----------------------- | ----------------------------------------------- | ------------------------------------------- | -------------------------------------------------- |
| **Segredo do cliente**  | `appPassword`                              | Configuração simples                        | Exige rotação do segredo, menos seguro              |
| **Certificado**         | `authType: "federated"` + `certificatePath`        | Nenhum segredo compartilhado pela rede      | Sobrecarga de gerenciamento de certificados         |
| **Identidade gerenciada** | `authType: "federated"` + `useManagedIdentity`      | Sem senha, nenhum segredo para gerenciar    | Exige infraestrutura do Azure                       |

`certificateThumbprint` pode ser definido junto com `certificatePath`, mas não é lido atualmente pelo fluxo de autenticação; ele é aceito apenas para compatibilidade futura.

**Padrão:** quando `authType` não está definido, o OpenClaw usa autenticação por segredo do cliente (`appPassword`). As configurações existentes continuam funcionando sem alterações.

## Desenvolvimento local (tunelamento)

O Teams não consegue acessar `localhost`. Use um túnel de desenvolvimento persistente para que a URL permaneça estável entre as sessões:

```bash
# Configuração única:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# A cada sessão de desenvolvimento:
devtunnel host my-openclaw-bot
```

Alternativas: `ngrok http 3978` ou `tailscale funnel 3978` (as URLs podem mudar a cada sessão).

Se a URL do túnel mudar, atualize o endpoint:

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

1. Instale o aplicativo do Teams (link de instalação em `teams app get <id> --install-link`).
2. Encontre o bot no Teams e envie uma mensagem direta.
3. Verifique os logs do Gateway para conferir a atividade recebida.

## Variáveis de ambiente

Estas chaves de configuração relacionadas à autenticação podem ser definidas por variáveis de ambiente em vez de `openclaw.json` (outras chaves de configuração, como `groupPolicy` ou `historyLimit`, só podem ser definidas na configuração):

| Variável de ambiente                 | Chave de configuração     | Observações                              |
| ------------------------------------ | ------------------------- | ---------------------------------------- |
| `MSTEAMS_APP_ID`                   | `appId`        |                                          |
| `MSTEAMS_APP_PASSWORD`                   | `appPassword`        |                                          |
| `MSTEAMS_TENANT_ID`                   | `tenantId`        |                                          |
| `MSTEAMS_AUTH_TYPE`                   | `authType`        | `"secret"` ou `"federated"` |
| `MSTEAMS_CERTIFICATE_PATH`                   | `certificatePath`        | federada + certificado                   |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`                   | `certificateThumbprint`        | aceita, não exigida para autenticação    |
| `MSTEAMS_USE_MANAGED_IDENTITY`                   | `useManagedIdentity`        | federada + identidade gerenciada         |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID`                   | `managedIdentityClientId`        | somente identidade gerenciada atribuída pelo usuário |

## Ação de informações do membro

O OpenClaw disponibiliza uma ação `member-info` baseada no Graph para o Microsoft Teams, permitindo que agentes e automações obtenham detalhes verificados da lista de membros de uma conversa configurada.

Requisitos:

- Permissões RSC `ChannelSettings.Read.Group` e `TeamMember.Read.Group` (já incluídas no manifesto recomendado).

A ação fica disponível sempre que as credenciais do Graph estão configuradas; não há um controle `channels.msteams.actions.memberInfo` separado.
As consultas de canais padrão retornam a identidade correspondente na lista de membros da equipe, o nome de exibição, o e-mail e as funções.
Na mensagem direta ou no chat em grupo atual, a ação pode retornar a ID de usuário estável do remetente confiável.
As consultas de membros de canais privados/compartilhados e de chats diferentes do atual exigem permissões adicionais para a lista de membros
e são rejeitadas pela linha de base de permissões padrão.

## Contexto do histórico

- `channels.msteams.historyLimit` controla quantas mensagens recentes do canal/grupo são incluídas no prompt. Usa `messages.groupChat.historyLimit` como alternativa e, em seguida, o padrão de 50. Defina `0` para desabilitar.
- O histórico de threads obtido é filtrado pelas listas de remetentes permitidos (`allowFrom` / `groupAllowFrom`), portanto, a inclusão inicial do contexto da thread contém apenas mensagens de remetentes permitidos.
- O contexto de anexos citados (analisado a partir do HTML do esquema Skype Reply nos próprios anexos de uma resposta) é repassado sem filtragem; atualmente, somente a inclusão inicial do histórico da thread aplica o filtro da lista de remetentes permitidos.
- O histórico de mensagens diretas pode ser limitado com `channels.msteams.dmHistoryLimit` (turnos do usuário). Substituições por usuário: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permissões RSC atuais do Teams (manifesto)

Estas são as **permissões resourceSpecific existentes** no manifesto do nosso aplicativo do Teams. Elas se aplicam apenas à equipe/ao chat em que o aplicativo está instalado.

**Para canais (escopo da equipe):**

- `ChannelMessage.Read.Group` (Aplicativo) - receber todas as mensagens do canal sem @menção
- `ChannelMessage.Send.Group` (Aplicativo)
- `Member.Read.Group` (Aplicativo)
- `Owner.Read.Group` (Aplicativo)
- `ChannelSettings.Read.Group` (Aplicativo)
- `TeamMember.Read.Group` (Aplicativo)
- `TeamSettings.Read.Group` (Aplicativo)

**Para chats em grupo:**

- `ChatMessage.Read.Chat` (Aplicativo) - receber todas as mensagens do chat em grupo sem @menção

Adicione permissões RSC pela CLI do Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Exemplo de manifesto do Teams (com dados ocultados)

Exemplo mínimo e válido com os campos obrigatórios. Substitua as IDs e URLs.

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

- `bots[].botId` **deve** corresponder à ID do aplicativo do Azure Bot.
- `webApplicationInfo.id` **deve** corresponder à ID do aplicativo do Azure Bot.
- `bots[].scopes` deve incluir as superfícies que se pretende usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` é obrigatório para o processamento de arquivos no escopo pessoal.
- `authorization.permissions.resourceSpecific` deve incluir leitura/envio de canais para o tráfego dos canais.

### Atualizando um aplicativo existente

```bash
# Baixe, edite e reenvie o manifesto
teams app manifest download <teamsAppId> manifest.json
# Edite manifest.json localmente...
teams app manifest upload manifest.json <teamsAppId>
# A versão é incrementada automaticamente se o conteúdo tiver sido alterado
```

Após a atualização, reinstale o aplicativo em cada equipe e **encerre completamente e abra novamente o Teams** (não apenas feche a janela) para limpar os metadados do aplicativo armazenados em cache.

<details>
<summary>Atualização manual do manifesto (sem CLI)</summary>

1. Atualize `manifest.json` com as novas configurações.
2. **Incremente o campo `version`** (por exemplo, `1.0.0` → `1.1.0`).
3. **Compacte novamente** o manifesto com os ícones (`manifest.json`, `outline.png`, `color.png`).
4. Carregue o novo arquivo zip:
   - **Teams Admin Center:** Teams apps → Manage apps → encontre seu aplicativo → Upload new version.
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## Recursos: somente RSC versus Graph

### Com **somente RSC do Teams** (aplicativo instalado, sem permissões da API do Graph)

Funciona:

- Ler o conteúdo de **texto** das mensagens do canal.
- Enviar conteúdo de **texto** nas mensagens do canal.
- Receber anexos de arquivos **pessoais (mensagem direta)**.

NÃO funciona:

- Conteúdo de **imagens ou arquivos** de canais/grupos (a carga inclui apenas um esboço em HTML).
- Baixar anexos armazenados no SharePoint/OneDrive.
- Ler o histórico de mensagens além do evento de Webhook em tempo real.

### Com **RSC do Teams + permissões de aplicativo do Microsoft Graph**

Adiciona:

- Baixar conteúdo hospedado (imagens coladas nas mensagens).
- Baixar anexos de arquivos armazenados no SharePoint/OneDrive.
- Ler o histórico de mensagens de canais/chats pelo Graph.

### RSC versus API do Graph

| Recurso                  | Permissões RSC         | API Graph                                     |
| ------------------------ | ---------------------- | --------------------------------------------- |
| **Mensagens em tempo real** | Sim (via Webhook)   | Não (somente consulta periódica)              |
| **Mensagens históricas** | Não                    | Sim (é possível consultar o histórico)        |
| **Complexidade da configuração** | Apenas o manifesto do aplicativo | Exige consentimento do administrador + fluxo de token |
| **Funciona offline**     | Não (deve estar em execução) | Sim (consulte a qualquer momento)       |

**Em resumo:** o RSC serve para escuta em tempo real; a API Graph serve para acesso ao histórico. Para recuperar mensagens perdidas enquanto estava offline, é necessária a API Graph com `ChannelMessage.Read.All` (exige consentimento do administrador).

## Mídia + histórico habilitados pelo Graph

Habilite somente as permissões de aplicativo do Microsoft Graph necessárias para os escopos e dados do Teams utilizados:

1. Entra ID (Azure AD) **App Registration** → adicione **Application permissions** do Graph:
   - `ChannelMessage.Read.All` para anexos e histórico de canais.
   - `Chat.Read.All` para anexos e histórico de chats em grupo.
   - `Files.Read.All` quando for necessário baixar os bytes de anexos do armazenamento do SharePoint/OneDrive; configurações somente de histórico não precisam dessa permissão.
2. Conceda **Grant admin consent** ao locatário.
3. Incremente a **manifest version** do aplicativo do Teams, faça o upload novamente e **reinstale o aplicativo no Teams**.
4. **Encerre completamente e reinicie o Teams** para limpar os metadados do aplicativo armazenados em cache.

### Recuperação de arquivos de canais/grupos (`graphMediaFallback`)

O Teams pode remover marcadores de arquivo da atividade HTML enviada a um bot. Nesse caso, a atividade do Bot Framework não pode ser distinguida de uma mensagem HTML comum; a referência completa do anexo existe somente na cópia da mensagem no Graph.

Habilite o fallback após conceder as permissões acima:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

Isso se aplica somente a canais e chats em grupo. Adiciona uma consulta de mensagem ao Graph sempre que uma atividade HTML não produz mídia diretamente disponível para download, inclusive em mensagens comuns ou que contenham apenas menções. O padrão é `false`, para que instalações existentes não passem a gerar tráfego adicional no Graph nem erros de permissão automaticamente.

**Menções a usuários:** as @menções funcionam imediatamente para usuários que já estão na conversa. Para pesquisar e mencionar dinamicamente usuários que **não estão na conversa atual**, adicione a permissão `User.Read.All` (Application) e conceda consentimento do administrador.

## Limitações conhecidas

### Tempos limite do Webhook

O Teams entrega mensagens via Webhook HTTP. O OpenClaw aplica tempos limite fixos do servidor HTTP ao listener desse Webhook: 30s de inatividade, 30s para a solicitação total e 15s para receber os cabeçalhos. O enriquecimento opcional de mídia recebida e contexto tem um orçamento compartilhado de 10 segundos, mas o SDK do Teams ainda aguarda o turno do agente antes de retornar a resposta do Webhook. Se o turno completo exceder a janela de repetição do Teams, poderão ocorrer:

- O Teams tentar entregar a mensagem novamente (causando duplicatas).
- Respostas descartadas.

As respostas são enviadas proativamente assim que o agente responde, mas execuções lentas do agente ainda podem provocar novas tentativas ou duplicatas no Teams.

### Compatibilidade com nuvens do Teams e URLs de serviço

Este caminho do Teams baseado no SDK é validado em ambiente real para a nuvem pública do Microsoft Teams.

As respostas recebidas usam o contexto de turno do SDK do Teams da mensagem recebida. Operações proativas fora de contexto — envios, edições, exclusões, cartões, enquetes, mensagens de consentimento para arquivos e respostas enfileiradas de longa duração — usam a referência de conversa armazenada `serviceUrl`. Por padrão, a nuvem pública usa o ambiente de nuvem pública do SDK do Teams e permite referências armazenadas no host público do Teams Connector: `https://smba.trafficmanager.net/`.

A nuvem pública é o padrão. Não é necessário definir `channels.msteams.cloud` nem `channels.msteams.serviceUrl` para bots normais da nuvem pública.

Para nuvens não públicas do Teams, defina `cloud` e o limite proativo correspondente quando a Microsoft publicar um:

- `channels.msteams.cloud` seleciona a predefinição de nuvem do SDK do Teams para autenticação, validação JWT, serviços de token e escopo do Graph.
- `channels.msteams.serviceUrl` seleciona o limite do endpoint do Bot Connector usado para validar referências de conversa armazenadas antes de envios, edições, exclusões, cartões, enquetes, mensagens de consentimento para arquivos e respostas enfileiradas de longa duração proativos. É obrigatório para as nuvens USGov e DoD do SDK. Para China/21Vianet, o OpenClaw usa a predefinição `China` do SDK e aceita URLs de serviço armazenadas/configuradas somente em hosts de canal do Azure China Bot Framework.

A Microsoft publica os endpoints globais proativos do Bot Connector na seção [Criar a conversa](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) da documentação sobre mensagens proativas do Teams. Use o `serviceUrl` da atividade recebida quando disponível; caso contrário, use a tabela da Microsoft abaixo.

| Ambiente do Teams | Configuração do OpenClaw                                  | `serviceUrl` proativo                            |
| ----------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Público            | nenhuma configuração de nuvem/serviceUrl necessária       | `https://smba.trafficmanager.net/teams`                                     |
| GCC                | defina `serviceUrl`; não existe uma predefinição de nuvem separada no SDK do Teams | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High           | `cloud: "USGov"` + `serviceUrl`                   | `https://smba.infra.gov.teams.microsoft.us/teams`                                     |
| DoD                | `cloud: "USGovDoD"` + `serviceUrl`                   | `https://smba.infra.dod.teams.microsoft.us/teams`                                     |
| China/21Vianet     | `cloud: "China"`                                         | use o `serviceUrl` da atividade recebida         |

Exemplo para GCC, em que a Microsoft documenta uma URL de serviço proativo separada, mas o SDK do Teams não oferece uma predefinição de nuvem GCC separada:

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

`channels.msteams.serviceUrl` é restrito aos hosts compatíveis do Microsoft Teams Bot Connector. Quando uma URL de serviço é configurada, o OpenClaw verifica se o `serviceUrl` da conversa armazenada usa o mesmo host antes de executar envios, edições, exclusões, cartões, enquetes ou respostas enfileiradas de longa duração proativos. Com a configuração padrão de nuvem pública, o OpenClaw falha de forma segura se uma conversa armazenada apontar para fora do host público do Teams Connector. Após alterar as configurações de nuvem/URL de serviço, receba uma nova mensagem da conversa para atualizar a referência de conversa armazenada.

A China/21Vianet não tem uma URL `smba` proativa global separada na tabela de endpoints proativos do Teams da Microsoft. Configure `cloud: "China"` para que o SDK do Teams use os endpoints de autenticação, token e JWT do Azure China. Os envios proativos exigem então uma referência de conversa armazenada proveniente de uma atividade recebida do Teams na China ou uma URL de serviço explicitamente configurada no limite do canal do Azure China Bot Framework (`*.botframework.azure.cn`). Os auxiliares do Teams baseados no Graph ficam desabilitados para `cloud: "China"` até que o OpenClaw encaminhe as solicitações do Graph pelo endpoint do Graph do Azure China.

### Formatação

O Markdown do Teams é mais limitado que o do Slack ou Discord:

- A formatação básica funciona: **negrito**, _itálico_, `code`, links.
- Markdown complexo (tabelas, listas aninhadas) pode não ser renderizado corretamente.
- Adaptive Cards são compatíveis com enquetes e envios de apresentação semântica (veja abaixo).

## Configuração

Principais configurações (consulte [/gateway/configuration](/pt-BR/gateway/configuration) para ver os padrões compartilhados de canais):

- `channels.msteams.enabled`: habilita/desabilita o canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenciais do bot.
- `channels.msteams.cloud`: ambiente de nuvem do SDK do Teams (`Public`, `USGov`, `USGovDoD` ou `China`; padrão `Public`). Defina com `serviceUrl` para nuvens do SDK USGov/DoD; a China usa a predefinição do SDK e referências de conversa armazenadas do Azure China Bot Framework, com auxiliares baseados no Graph desabilitados até que o roteamento do Azure China Graph seja disponibilizado.
- `channels.msteams.serviceUrl`: limite da URL do serviço Bot Connector para operações proativas do SDK. A nuvem pública usa o padrão do SDK; defina para GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High ou DoD. A China aceita hosts de canal do Azure China Bot Framework quando a referência de conversa armazenada vem do Teams operado pela 21Vianet.
- `channels.msteams.webhook.port` (padrão `3978`).
- `channels.msteams.webhook.path` (padrão `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (padrão `pairing`).
- `channels.msteams.allowFrom`: lista de permissões de MDs (IDs de objeto do AAD recomendados). O assistente resolve nomes para IDs durante a configuração quando o acesso ao Graph está disponível.
- `channels.msteams.dangerouslyAllowNameMatching`: opção de emergência para reabilitar a correspondência mutável de UPN/nome de exibição e o roteamento direto por nome de equipe/canal.
- `channels.msteams.textChunkLimit`: tamanho dos segmentos de texto de saída em caracteres (padrão `4000`, com limite máximo rígido de `4000`, independentemente de um valor configurado maior).
- `channels.msteams.streaming.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da segmentação por comprimento.
- `channels.msteams.mediaAllowHosts`: lista de permissões de hosts para anexos recebidos (o padrão são domínios da Microsoft/Teams: Graph, SharePoint/OneDrive, CDN do Teams, Bot Framework, Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: lista de permissões para anexar cabeçalhos Authorization em novas tentativas de mídia (o padrão são hosts do Graph + Bot Framework).
- `channels.msteams.graphMediaFallback`: habilita consultas de mensagens no Graph quando o HTML do canal/grupo omite marcadores de arquivo (padrão `false`; consulte [Recuperação de arquivos de canal/grupo](#channelgroup-file-recovery-graphmediafallback)).
- `channels.msteams.mediaMaxMb`: substituição do limite de tamanho de mídia por canal em MB. Usa `agents.defaults.mediaMaxMb` como alternativa quando não definido.
- `channels.msteams.requireMention`: exige @menção em canais/grupos (padrão `true`).
- `channels.msteams.replyStyle`: `thread | top-level` (consulte [Estilo de resposta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: substituição por equipe.
- `channels.msteams.teams.<teamId>.requireMention`: substituição por equipe.
- `channels.msteams.teams.<teamId>.tools`: substituições padrão da política de ferramentas por equipe (`allow`/`deny`/`alsoAllow`) usadas quando não há uma substituição de canal.
- `channels.msteams.teams.<teamId>.toolsBySender`: substituições padrão da política de ferramentas por equipe e por remetente (curinga `"*"` compatível).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: substituições da política de ferramentas por canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: substituições da política de ferramentas por canal e por remetente (curinga `"*"` compatível).
- As chaves de `toolsBySender` devem usar prefixos explícitos: `channel:`, `id:`, `e164:`, `username:`, `name:` (chaves legadas sem prefixo ainda são mapeadas somente para `id:`).
- `channels.msteams.authType`: tipo de autenticação — `"secret"` (padrão) ou `"federated"`.
- `channels.msteams.certificatePath`: caminho para o arquivo de certificado PEM (autenticação federada + certificado).
- `channels.msteams.certificateThumbprint`: impressão digital do certificado; aceita, mas não é obrigatória para autenticação.
- `channels.msteams.useManagedIdentity`: habilita a autenticação por identidade gerenciada (modo federado).
- `channels.msteams.managedIdentityClientId`: ID do cliente da identidade gerenciada atribuída pelo usuário.
- `channels.msteams.sharePointSiteId`: ID do site do SharePoint para uploads de arquivos em chats em grupo/canais (consulte [Envio de arquivos em chats em grupo](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: Cartão Adaptável de boas-vindas exibido no primeiro contato por MD/grupo e seus botões de prompts sugeridos.
- `channels.msteams.responsePrefix`: texto adicionado como prefixo às respostas de saída.
- `channels.msteams.feedbackEnabled` (padrão `true`), `channels.msteams.feedbackReflection` (padrão `true`), `channels.msteams.feedbackReflectionCooldownMs`: feedback positivo/negativo nas respostas e o acompanhamento de reflexão sobre feedback negativo.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: conexão OAuth do Bot Framework e escopos delegados do Graph para fluxos baseados em SSO; `sso.enabled: true` exige `sso.connectionName`.

## Roteamento e sessões

- As chaves de sessão seguem o formato padrão do agente (consulte [/concepts/session](/pt-BR/concepts/session)):
  - As mensagens diretas compartilham a sessão principal (`agent:<agentId>:<mainKey>`).
  - As mensagens de canal/grupo usam o ID da conversa:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de resposta: threads versus publicações

O Teams tem dois estilos de interface de canal sobre o mesmo modelo de dados subjacente:

| Estilo                   | Descrição                                                        | `replyStyle` recomendado |
| ------------------------ | ---------------------------------------------------------------- | ------------------------ |
| **Publicações** (clássico) | As mensagens aparecem como cartões com respostas encadeadas abaixo | `thread` (padrão) |
| **Threads** (estilo Slack) | As mensagens fluem linearmente, de forma mais semelhante ao Slack | `top-level`       |

**O problema:** a API do Teams não informa qual estilo de interface um canal usa. Se for usado o `replyStyle` incorreto:

- `thread` em um canal no estilo Threads → as respostas aparecem aninhadas de forma inadequada.
- `top-level` em um canal no estilo Publicações → as respostas aparecem como publicações separadas de nível superior, em vez de dentro da thread.

**Solução:** configure `replyStyle` por canal com base na configuração do canal:

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

Quando o bot envia uma resposta para um canal, `replyStyle` é resolvido da substituição mais específica até o padrão. O primeiro valor que não seja `undefined` prevalece:

1. **Por canal** — `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Por equipe** — `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** — `channels.msteams.replyStyle`
4. **Padrão implícito** — derivado de `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Se `requireMention: false` for definido globalmente sem um `replyStyle` explícito, as menções em canais no estilo Publicações aparecem como publicações de nível superior, mesmo quando a mensagem recebida era uma resposta em uma thread. Fixe `replyStyle: "thread"` no nível global, de equipe ou de canal para evitar surpresas.

Para envios proativos a uma conversa de canal armazenada (respostas de chamadas de ferramentas em fila, agentes de longa duração), aplica-se a mesma resolução de equipe/canal; chats em grupo e conversas pessoais (MD) sempre são resolvidos como `top-level` para envios proativos, independentemente de `replyStyle`.

### Preservação do contexto da thread

Quando `replyStyle: "thread"` está em vigor e o bot recebeu uma @menção dentro de uma thread de canal, o OpenClaw anexa novamente a raiz original da thread à referência de conversa de saída (`19:...@thread.tacv2;messageid=<root>`) para que a resposta seja enviada dentro da mesma thread. Isso vale tanto para envios ao vivo (durante o turno) quanto para envios proativos feitos após o contexto de turno do Bot Framework expirar (por exemplo, agentes de longa duração e respostas de chamadas de ferramentas em fila por meio de `mcp__openclaw__message`).

A raiz da thread é obtida de `threadId` armazenado na referência de conversa. Referências armazenadas mais antigas, anteriores a `threadId`, usam `activityId` como alternativa (a atividade recebida que inicializou a conversa mais recentemente), portanto as implantações existentes continuam funcionando sem uma nova inicialização.

Quando `replyStyle: "top-level"` está em vigor, mensagens recebidas em threads de canal são intencionalmente respondidas como novas publicações de nível superior; nenhum sufixo de thread é anexado. Isso é correto para canais no estilo Threads; publicações de nível superior quando eram esperadas respostas encadeadas significam que `replyStyle` está configurado incorretamente para esse canal.

## Anexos e imagens

**Limitações atuais:**

- **MDs:** imagens e anexos de arquivos funcionam por meio das APIs de arquivos de bot do Teams.
- **Canais/grupos:** os anexos ficam no armazenamento do M365 (SharePoint/OneDrive). A carga do Webhook inclui apenas um esboço HTML, não os bytes reais do arquivo. **São necessárias permissões da API do Graph** para baixar anexos de canais.
- Para envios explícitos que priorizam o arquivo, use `action=upload-file` com `media` / `filePath` / `path`; o `message` opcional torna-se o texto/comentário que acompanha o arquivo, e `filename` (ou `title`) substitui o nome do arquivo enviado.

Sem permissões do Graph, mensagens de canal com imagens chegam apenas como texto (o conteúdo da imagem não fica acessível ao bot).
Por padrão, o OpenClaw baixa mídia somente de nomes de host da Microsoft/Teams. Substitua com `channels.msteams.mediaAllowHosts` (use `["*"]` para permitir qualquer host).
Os cabeçalhos Authorization são anexados somente para hosts em `channels.msteams.mediaAuthAllowHosts` (o padrão são hosts do Graph + Bot Framework). Mantenha essa lista restrita (evite sufixos multilocatários).

## Envio de arquivos em chats em grupo

Os bots podem enviar arquivos em MDs usando o fluxo integrado FileConsentCard. **O envio de arquivos em chats em grupo/canais** exige configuração adicional:

| Contexto                 | Como os arquivos são enviados                         | Configuração necessária                           |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------- |
| **MDs**                  | FileConsentCard → o usuário aceita → o bot faz upload | Funciona sem configuração adicional               |
| **Chats em grupo/canais** | Upload para o SharePoint → cartão de arquivo nativo   | Exige `sharePointSiteId` + permissões do Graph    |
| **Imagens (qualquer contexto)** | Codificadas em Base64 em linha                 | Funciona sem configuração adicional               |

### Por que chats em grupo precisam do SharePoint

Os bots usam uma identidade de aplicativo, enquanto o recurso `/me` do Microsoft Graph [exige um usuário conectado](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). Para enviar arquivos em chats em grupo/canais, o bot faz upload para um **site do SharePoint** e cria um link de compartilhamento.

### Configuração

1. **Adicione permissões da API do Graph** em Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Aplicativo) — faça upload de arquivos para o SharePoint.
   - `ChatMember.Read.All` (Aplicativo) — permissão de privilégio mínimo em todo o locatário para envios de arquivos em chats em grupo. `Chat.Read.All` também funciona e já oferece essa cobertura quando o histórico de chats em grupo está habilitado. Como alternativa por chat, use a [permissão de consentimento específica do recurso](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent) `ChatMember.Read.Chat`.
2. **Conceda consentimento do administrador** para o locatário.
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
         // ... outras configurações ...
         sharePointSiteId: "contoso.sharepoint.com,guid1,guid2",
       },
     },
   }
   ```

### Comportamento de compartilhamento

| Contexto e permissão                                                    | Comportamento de compartilhamento                                  |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Canal + `Sites.ReadWrite.All`                                              | Link de compartilhamento para toda a organização (qualquer pessoa da organização pode acessar) |
| Chat em grupo + `Sites.ReadWrite.All` + uma concessão compatível de leitura dos membros do chat | Link de compartilhamento por usuário (somente membros do chat podem acessar) |
| Chat em grupo sem uma concessão compatível de leitura dos membros do chat | O envio falha de forma restritiva                                  |

O compartilhamento por usuário é mais seguro, pois somente os participantes do chat podem acessar o arquivo. O OpenClaw exige uma consulta bem-sucedida dos membros em chats em grupo; tempos limite, falhas de transporte, resultados vazios e recusas da API Graph fazem o envio falhar, em vez de ampliar o acesso para a organização.

### Comportamento alternativo

| Cenário                                                          | Resultado                                             |
| ---------------------------------------------------------------- | ----------------------------------------------------- |
| Chat em grupo + arquivo + permissões do SharePoint e de membros configuradas | Fazer upload para o SharePoint e enviar um cartão de arquivo nativo |
| Chat em grupo + arquivo + ausência de permissões do SharePoint ou de membros | Falhar com um erro de configuração que indique como agir |
| Canal + arquivo + `sharePointSiteId` configurado                 | Fazer upload para o SharePoint e enviar um cartão de arquivo nativo |
| Chat pessoal + arquivo                                           | Fluxo FileConsentCard (funciona sem o SharePoint)     |
| Qualquer contexto + imagem                                       | Embutida e codificada em Base64 (funciona sem o SharePoint) |

### Local de armazenamento dos arquivos

Os arquivos enviados são armazenados em uma pasta `/OpenClawShared/` na biblioteca de documentos padrão do site do SharePoint configurado.

## Enquetes (Cartões Adaptáveis)

O OpenClaw envia enquetes do Teams como Cartões Adaptáveis (não há uma API nativa de enquetes do Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- Os votos são registrados pelo Gateway no SQLite de estado do Plugin do OpenClaw em `state/openclaw.sqlite`.
- Os arquivos `msteams-polls.json` existentes são importados por `openclaw doctor --fix`, não pelo Plugin em execução.
- O Gateway deve permanecer online para registrar os votos.
- As enquetes não publicam automaticamente resumos dos resultados e ainda não há uma CLI de resultados de enquetes.

## Cartões de apresentação

Envie cargas de apresentação semânticas para usuários ou conversas do Teams usando a ferramenta `message`, a CLI ou a entrega normal de respostas. O OpenClaw as renderiza como Cartões Adaptáveis do Teams com base no contrato genérico de apresentação.

O parâmetro `presentation` aceita blocos semânticos. Quando `presentation` é fornecido, o texto da mensagem é opcional. Os botões são renderizados como ações de envio ou URL do Cartão Adaptável. Os menus de seleção não são nativos do renderizador do Teams, portanto, o OpenClaw os converte em texto legível antes da entrega.

**Ferramenta do agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:<id>",
  presentation: {
    title: "Olá",
    blocks: [{ type: "text", text: "Olá!" }],
  },
}
```

**CLI:**

```bash
openclaw message send --channel msteams \
  --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Olá","blocks":[{"type":"text","text":"Olá!"}]}'
```

Para obter detalhes sobre o formato do destino, consulte [Formatos de destino](#target-formats) abaixo.

## Formatos de destino

Os destinos do MSTeams usam prefixos para distinguir entre usuários e conversas:

| Tipo de destino      | Formato                          | Exemplo                                                                                                |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Usuário (por ID)     | `user:<aad-object-id>`               | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                                                     |
| Usuário (por nome)   | `user:<display-name>`               | `user:John Smith` (requer a API Graph)                                                                |
| Grupo/canal          | `conversation:<conversation-id>`               | `conversation:19:abc123...@thread.tacv2`                                                                                     |
| Grupo/canal (bruto)  | `<conversation-id>`               | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces` ou um ID do Bot Framework `a:`/`8:orgid:`/`29:` sem prefixo |

**Exemplos de CLI:**

```bash
# Enviar para um usuário por ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Olá"

# Enviar para um usuário pelo nome de exibição (aciona uma consulta à API Graph)
openclaw message send --channel msteams --target "user:John Smith" --message "Olá"

# Enviar para um chat em grupo ou canal
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" --message "Olá"

# Enviar um cartão de apresentação para uma conversa
openclaw message send --channel msteams --target "conversation:19:abc...@thread.tacv2" \
  --presentation '{"title":"Olá","blocks":[{"type":"text","text":"Olá"}]}'
```

**Exemplos da ferramenta do agente:**

```json5
{
  action: "send",
  channel: "msteams",
  target: "user:John Smith",
  message: "Olá!",
}
```

```json5
{
  action: "send",
  channel: "msteams",
  target: "conversation:19:abc...@thread.tacv2",
  presentation: {
    title: "Olá",
    blocks: [{ type: "text", text: "Olá" }],
  },
}
```

<Note>
Sem o prefixo `user:`, os nomes são resolvidos como grupo ou equipe por padrão. Sempre use `user:` ao direcionar mensagens a pessoas pelo nome de exibição.
</Note>

## Mensagens proativas

- As mensagens proativas só são possíveis **depois** que um usuário interage, pois o OpenClaw armazena as referências da conversa nesse momento.
- Consulte [/gateway/configuration](/pt-BR/gateway/configuration) para saber mais sobre `dmPolicy` e a restrição por lista de permissões.

## IDs de equipe e canal (armadilha comum)

O parâmetro de consulta `groupId` nas URLs do Teams **NÃO** é o ID da equipe usado para configuração. Em vez disso, extraia os IDs do caminho da URL:

**URL da equipe:**

```text
https://teams.microsoft.com/l/team/19%3ABk4j...%40thread.tacv2/conversations?groupId=...
                                    └────────────────────────────┘
                                    ID da conversa da equipe (decodifique a URL)
```

**URL do canal:**

```text
https://teams.microsoft.com/l/channel/19%3A15bc...%40thread.tacv2/ChannelName?groupId=...
                                      └─────────────────────────┘
                                      ID do canal (decodifique a URL)
```

**Para configuração:**

- Chave da equipe = segmento do caminho após `/team/` (com a URL decodificada, por exemplo, `19:Bk4j...@thread.tacv2`; locatários mais antigos podem mostrar `@thread.skype`, que também é válido).
- Chave do canal = segmento do caminho após `/channel/` (com a URL decodificada).
- **Ignore** o parâmetro de consulta `groupId` para o roteamento do OpenClaw. Ele é o ID do grupo do Microsoft Entra, não o ID da conversa do Bot Framework usado nas atividades recebidas do Teams.

## Canais privados

Os bots têm suporte limitado em canais privados:

| Recurso                       | Canais padrão | Canais privados            |
| ----------------------------- | ------------- | -------------------------- |
| Instalação do bot             | Sim           | Limitada                   |
| Mensagens em tempo real (webhook) | Sim       | Podem não funcionar        |
| Permissões RSC                | Sim           | Podem se comportar de forma diferente |
| @menções                      | Sim           | Se o bot estiver acessível |
| Histórico da API Graph        | Sim           | Sim (com permissões)       |

**Alternativas caso os canais privados não funcionem:**

1. Use canais padrão para interações com o bot.
2. Use mensagens diretas; os usuários sempre podem enviar mensagens diretamente ao bot.
3. Use a API Graph para acesso ao histórico (requer `ChannelMessage.Read.All`).

## Solução de problemas

### Problemas comuns

- **Imagens não aparecem nos canais:** faltam permissões do Graph ou consentimento do administrador. Reinstale o aplicativo do Teams, feche-o completamente e abra-o novamente.
- **Sem respostas no canal:** as menções são obrigatórias por padrão; defina `channels.msteams.requireMention=false` ou configure por equipe/canal.
- **Incompatibilidade de versão (o Teams ainda mostra o manifesto antigo):** remova e adicione novamente o aplicativo e feche completamente o Teams para atualizá-lo.
- **401 Unauthorized do webhook:** esperado ao testar manualmente sem um JWT do Azure; significa que o endpoint está acessível, mas a autenticação falhou. Use o Azure Web Chat para testar corretamente.

### Erros no upload do manifesto

- **"Icon file cannot be empty":** o manifesto referencia arquivos de ícone com 0 bytes. Crie ícones PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** o aplicativo ainda está instalado em outra equipe/chat. Primeiro, localize-o e desinstale-o ou aguarde 5-10 minutos pela propagação.
- **"Something went wrong" durante o upload:** faça o upload por [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), abra as Ferramentas do Desenvolvedor do navegador (F12) → guia Network e verifique o corpo da resposta para identificar o erro real.
- **Falha no sideload:** tente "Upload an app to your org's app catalog" em vez de "Upload a custom app"; isso frequentemente contorna as restrições de sideload.

### Permissões RSC não funcionam

1. Verifique se `webApplicationInfo.id` corresponde exatamente ao App ID do seu bot.
2. Faça novamente o upload do aplicativo e reinstale-o na equipe/chat.
3. Verifique se o administrador da sua organização bloqueou as permissões RSC.
4. Confirme se está usando o escopo correto: `ChannelMessage.Read.Group` para equipes, `ChatMessage.Read.Chat` para chats em grupo.

## Referências

- [Criar um Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guia de configuração do Azure Bot
- [Portal do Desenvolvedor do Teams](https://dev.teams.microsoft.com/apps) - crie/gerencie aplicativos do Teams
- [Esquema do manifesto de aplicativo do Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receber mensagens de canal com RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referência de permissões RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Tratamento de arquivos por bots do Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo requer o Graph)
- [Mensagens proativas](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI do Teams para gerenciamento de bots

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação por mensagem direta e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento do chat em grupo e controle por menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e reforço de segurança
