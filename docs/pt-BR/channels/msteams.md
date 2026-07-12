---
read_when:
    - Trabalhando em recursos do canal do Microsoft Teams
summary: Status, recursos e configuração do bot do Microsoft Teams
title: Microsoft Teams
x-i18n:
    generated_at: "2026-07-12T14:55:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c01ef9ac8892c19b42e0f03e427f9e87be9868b8901879d93d1762d1533aab70
    source_path: channels/msteams.md
    workflow: 16
---

Status: há suporte a texto + anexos em MDs; o envio de arquivos em canais/grupos requer `sharePointSiteId` + permissões do Graph (consulte [Envio de arquivos em chats em grupo](#sending-files-in-group-chats)). As enquetes são enviadas por meio de Adaptive Cards. As ações de mensagem disponibilizam explicitamente `upload-file` para envios que começam por um arquivo.

## Plugin incluído

O Microsoft Teams é fornecido como um plugin incluído nas versões atuais do OpenClaw; nenhuma instalação separada é necessária na compilação empacotada normal.

Em uma compilação mais antiga ou em uma instalação personalizada que exclua o Teams incluído, instale o pacote npm diretamente:

```bash
openclaw plugins install @openclaw/msteams
```

Use o pacote sem versão para acompanhar a tag da versão oficial atual. Fixe uma versão exata somente quando precisar de uma instalação reproduzível.

Checkout local (executando a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/msteams-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

O [`@microsoft/teams.cli`](https://www.npmjs.com/package/@microsoft/teams.cli) realiza o registro do bot, a criação do manifesto e a geração de credenciais em um único comando.

**1. Instale e faça login**

```bash
npm install -g @microsoft/teams.cli@preview
teams login
teams status   # verifique se você fez login e veja as informações do seu locatário
```

<Note>
A CLI do Teams está atualmente em versão prévia. Os comandos e sinalizadores podem mudar entre versões.
</Note>

**2. Inicie um túnel** (o Teams não consegue acessar localhost)

Instale e autentique a CLI devtunnel, se necessário ([guia de introdução](https://learn.microsoft.com/en-us/azure/developer/dev-tunnels/get-started)).

```bash
# Configuração única (URL persistente entre sessões):
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Em cada sessão de desenvolvimento:
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

Isso cria um aplicativo do Entra ID (Azure AD), gera um segredo do cliente, cria e carrega um manifesto de aplicativo do Teams (com ícones) e registra um bot gerenciado pelo Teams (nenhuma assinatura do Azure é necessária). A saída inclui `CLIENT_ID`, `CLIENT_SECRET`, `TENANT_ID` e uma **ID de aplicativo do Teams**; ela também oferece a opção de instalar o aplicativo diretamente no Teams.

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

Ou use as variáveis de ambiente diretamente: `MSTEAMS_APP_ID`, `MSTEAMS_APP_PASSWORD`, `MSTEAMS_TENANT_ID`.

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

- Conversar com o OpenClaw por meio de MDs, chats em grupo ou canais do Teams.
- Manter o roteamento determinístico: as respostas sempre retornam ao canal pelo qual chegaram.
- Usar por padrão um comportamento seguro nos canais (menções obrigatórias, a menos que configurado de outra forma).

## Gravações de configuração

Por padrão, o Microsoft Teams pode gravar atualizações de configuração acionadas por `/config set|unset` (requer `commands.config: true`).

Desative com:

```json5
{
  channels: { msteams: { configWrites: false } },
}
```

## Controle de acesso (MDs + grupos)

**Acesso por MD**

- Padrão: `channels.msteams.dmPolicy = "pairing"`. Remetentes desconhecidos são ignorados até serem aprovados.
- `channels.msteams.allowFrom` deve usar IDs de objeto AAD estáveis ou grupos estáticos de acesso de remetentes, como `accessGroup:core-team`.
- Não dependa da correspondência por UPN/nome de exibição para listas de permissões; eles podem mudar. O OpenClaw desativa a correspondência direta por nome por padrão; habilite-a com `channels.msteams.dangerouslyAllowNameMatching: true`.
- O assistente pode resolver nomes para IDs por meio do Microsoft Graph quando as credenciais permitirem.

**Acesso de grupo**

- Padrão: `channels.msteams.groupPolicy = "allowlist"` (bloqueado, a menos que você adicione `groupAllowFrom`). `channels.defaults.groupPolicy` pode substituir o padrão compartilhado quando `channels.msteams.groupPolicy` não estiver definido.
- `channels.msteams.groupAllowFrom` controla quais remetentes ou grupos estáticos de acesso de remetentes podem acionar ações em chats em grupo/canais (usa `channels.msteams.allowFrom` como alternativa).
- Defina `groupPolicy: "open"` para permitir qualquer membro (ainda com exigência de menção por padrão).
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

- Restrinja as respostas de grupo/canal listando equipes e canais em `channels.msteams.teams`.
- Use IDs de conversa estáveis do Teams, obtidos em links do Teams, como chaves, e não nomes de exibição mutáveis (consulte [IDs de equipe e canal](#team-and-channel-ids-common-gotcha)).
- Quando `groupPolicy="allowlist"` e houver uma lista de permissões de equipes, somente as equipes/os canais listados serão aceitos (com exigência de menção).
- O assistente de configuração aceita entradas `Team/Channel` e as armazena para você.
- Na inicialização, o OpenClaw resolve nomes de equipe/canal e de usuários da lista de permissões para IDs (quando as permissões do Graph permitem) e registra o mapeamento. Os nomes não resolvidos são mantidos conforme digitados, mas ignorados para roteamento, a menos que `channels.msteams.dangerouslyAllowNameMatching: true` esteja definido.

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

1. Verifique se o plugin do Microsoft Teams está disponível (incluído nas versões atuais).
2. Crie um **Azure Bot** (ID do aplicativo + segredo + ID do locatário).
3. Crie um **pacote de aplicativo do Teams** que faça referência ao bot, incluindo as permissões RSC abaixo.
4. Carregue/instale o aplicativo do Teams em uma equipe (ou no escopo pessoal para MDs).
5. Configure `msteams` em `~/.openclaw/openclaw.json` (ou nas variáveis de ambiente) e inicie o Gateway.
6. Por padrão, o Gateway escuta o tráfego de Webhook do Bot Framework em `/api/messages`.

### Etapa 1: Crie um Azure Bot

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
A criação de novos bots multilocatários foi descontinuada após 2025-07-31. Use **Single Tenant** para novos bots.
</Warning>

3. Clique em **Review + create** e depois em **Create** (~1-2 minutos).

### Etapa 2: Obtenha as credenciais

1. Recurso Azure Bot → **Configuration** → copie **Microsoft App ID** (seu `appId`).
2. **Manage Password** → App Registration → **Certificates & secrets** → **New client secret** → copie o **Value** (seu `appPassword`).
3. **Overview** → copie **Directory (tenant) ID** (seu `tenantId`).

### Etapa 3: Configure o endpoint de mensagens

1. Azure Bot → **Configuration**.
2. Defina **Messaging endpoint**:
   - Produção: `https://your-domain.com/api/messages`
   - Desenvolvimento local: use um túnel (consulte [Desenvolvimento local](#local-development-tunneling))

### Etapa 4: Ative o canal do Teams

1. Azure Bot → **Channels**.
2. Clique em **Microsoft Teams** → Configure → Save.
3. Aceite os Termos de Serviço.

### Etapa 5: Crie o manifesto do aplicativo do Teams

- Inclua uma entrada `bot` com `botId = <App ID>`.
- Escopos: `personal`, `team`, `groupChat`.
- `supportsFiles: true` (obrigatório para o processamento de arquivos no escopo pessoal).
- Adicione permissões RSC (consulte [Permissões RSC](#current-teams-rsc-permissions-manifest)).
- Crie os ícones: `outline.png` (32x32) e `color.png` (192x192).
- Compacte `manifest.json`, `outline.png` e `color.png` juntos.

### Etapa 6: Configure o OpenClaw

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

### Etapa 7: Execute o Gateway

O canal do Teams é iniciado automaticamente quando o plugin está disponível e a configuração de `msteams` contém credenciais.

</details>

## Autenticação federada (certificado mais identidade gerenciada)

Para produção, o OpenClaw oferece suporte à **autenticação federada** como alternativa aos segredos do cliente, por meio de `channels.msteams.authType: "federated"`. Há dois métodos:

### Opção A: Autenticação baseada em certificado

Use um certificado PEM registrado no registro do aplicativo do Entra ID.

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
3. Durante a execução, o OpenClaw usa `@azure/identity` para adquirir tokens do endpoint IMDS do Azure.
4. O token é passado ao SDK do Teams para a autenticação do bot.

**Pré-requisitos:**

- Infraestrutura do Azure com identidade gerenciada ativada (identidade de carga de trabalho do AKS, App Service, VM).
- Credencial de identidade federada criada no registro do aplicativo do Entra ID.
- Acesso de rede ao IMDS (`169.254.169.254:80`) a partir do pod/da VM.

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

### Configuração da Identidade de Carga de Trabalho do AKS

Para implantações no AKS que usam identidade de carga de trabalho:

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

3. **Anote a conta de serviço do Kubernetes** com o ID de cliente do aplicativo:

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

| Método                     | Configuração                                    | Vantagens                                   | Desvantagens                                              |
| -------------------------- | ----------------------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| **Segredo do cliente**     | `appPassword`                                   | Configuração simples                        | Exige rotação do segredo, é menos seguro                  |
| **Certificado**            | `authType: "federated"` + `certificatePath`     | Nenhum segredo compartilhado pela rede      | Sobrecarga de gerenciamento do certificado                |
| **Identidade Gerenciada**  | `authType: "federated"` + `useManagedIdentity`  | Sem senha, nenhum segredo para gerenciar    | Exige infraestrutura do Azure                             |

`certificateThumbprint` pode ser definido junto com `certificatePath`, mas atualmente não é lido pelo caminho de autenticação; ele é aceito apenas para compatibilidade futura.

**Padrão:** quando `authType` não está definido, o OpenClaw usa autenticação por segredo do cliente (`appPassword`). As configurações existentes continuam funcionando sem alterações.

## Desenvolvimento local (tunelamento)

O Teams não consegue acessar `localhost`. Use um túnel de desenvolvimento persistente para que a URL permaneça estável entre as sessões:

```bash
# Configuração única:
devtunnel create my-openclaw-bot --allow-anonymous
devtunnel port create my-openclaw-bot -p 3978 --protocol auto

# Em cada sessão de desenvolvimento:
devtunnel host my-openclaw-bot
```

Alternativas: `ngrok http 3978` ou `tailscale funnel 3978` (as URLs podem mudar a cada sessão).

Se a URL do túnel mudar, atualize o endpoint:

```bash
teams app update <teamsAppId> --endpoint "https://<new-url>/api/messages"
```

## Teste do bot

**Execute os diagnósticos:**

```bash
teams app doctor <teamsAppId>
```

Verifica o registro do bot, o aplicativo AAD, o manifesto e a configuração de SSO em uma única execução.

**Envie uma mensagem de teste:**

1. Instale o aplicativo do Teams (link de instalação obtido com `teams app get <id> --install-link`).
2. Encontre o bot no Teams e envie uma mensagem direta.
3. Verifique os logs do Gateway em busca de atividades recebidas.

## Variáveis de ambiente

Estas chaves de configuração relacionadas à autenticação podem ser definidas por variáveis de ambiente em vez de `openclaw.json` (outras chaves de configuração, como `groupPolicy` ou `historyLimit`, só podem ser definidas na configuração):

| Variável de ambiente                 | Chave de configuração     | Observações                                            |
| ------------------------------------ | ------------------------- | ----------------------------------------------------- |
| `MSTEAMS_APP_ID`                     | `appId`                   |                                                       |
| `MSTEAMS_APP_PASSWORD`               | `appPassword`             |                                                       |
| `MSTEAMS_TENANT_ID`                  | `tenantId`                |                                                       |
| `MSTEAMS_AUTH_TYPE`                  | `authType`                | `"secret"` ou `"federated"`                           |
| `MSTEAMS_CERTIFICATE_PATH`           | `certificatePath`         | federada + certificado                                |
| `MSTEAMS_CERTIFICATE_THUMBPRINT`     | `certificateThumbprint`   | aceito, não é obrigatório para autenticação           |
| `MSTEAMS_USE_MANAGED_IDENTITY`       | `useManagedIdentity`      | federada + identidade gerenciada                      |
| `MSTEAMS_MANAGED_IDENTITY_CLIENT_ID` | `managedIdentityClientId` | somente identidade gerenciada atribuída pelo usuário  |

## Ação de informações do membro

O OpenClaw disponibiliza uma ação `member-info` baseada no Graph para o Microsoft Teams, permitindo que agentes e automações consultem detalhes verificados da lista de membros de uma conversa configurada.

Requisitos:

- Permissões RSC `ChannelSettings.Read.Group` e `TeamMember.Read.Group` (já incluídas no manifesto recomendado).

A ação fica disponível sempre que as credenciais do Graph estão configuradas; não há um controle separado `channels.msteams.actions.memberInfo`.
As consultas em canais padrão retornam a identidade correspondente na lista de membros da equipe, o nome de exibição, o e-mail e as funções.
Na mensagem direta ou no chat em grupo atual, a ação pode retornar o ID de usuário estável do remetente confiável.
As consultas de membros de canais privados/compartilhados e de chats que não sejam o atual exigem permissões adicionais para a lista de membros
e são rejeitadas pelo conjunto padrão de permissões.

## Contexto do histórico

- `channels.msteams.historyLimit` controla quantas mensagens recentes do canal/grupo são incluídas no prompt. Usa `messages.groupChat.historyLimit` como alternativa e, depois, o padrão de 50. Defina como `0` para desabilitar.
- O histórico de threads obtido é filtrado pelas listas de remetentes permitidos (`allowFrom` / `groupAllowFrom`), portanto, a inclusão inicial do contexto da thread contém apenas mensagens de remetentes permitidos.
- O contexto de anexos citados (analisado a partir do HTML no esquema Skype Reply presente nos próprios anexos de uma resposta) é repassado sem filtragem; atualmente, somente a inclusão inicial do histórico da thread aplica o filtro da lista de remetentes permitidos.
- O histórico de mensagens diretas pode ser limitado com `channels.msteams.dmHistoryLimit` (turnos do usuário). Substituições por usuário: `channels.msteams.dms["<user_id>"].historyLimit`.

## Permissões RSC atuais do Teams (manifesto)

Estas são as **permissões resourceSpecific existentes** no manifesto do nosso aplicativo do Teams. Elas se aplicam apenas dentro da equipe/do chat em que o aplicativo está instalado.

**Para canais (escopo da equipe):**

- `ChannelMessage.Read.Group` (Application) - receber todas as mensagens do canal sem @menção
- `ChannelMessage.Send.Group` (Application)
- `Member.Read.Group` (Application)
- `Owner.Read.Group` (Application)
- `ChannelSettings.Read.Group` (Application)
- `TeamMember.Read.Group` (Application)
- `TeamSettings.Read.Group` (Application)

**Para chats em grupo:**

- `ChatMessage.Read.Chat` (Application) - receber todas as mensagens do chat em grupo sem @menção

Adicione permissões RSC pela CLI do Teams:

```bash
teams app rsc add <teamsAppId> ChannelMessage.Read.Group --type Application
```

## Exemplo de manifesto do Teams (com dados ocultados)

Exemplo mínimo e válido com os campos obrigatórios. Substitua os IDs e as URLs.

```json5
{
  $schema: "https://developer.microsoft.com/en-us/json-schemas/teams/v1.23/MicrosoftTeams.schema.json",
  manifestVersion: "1.23",
  version: "1.0.0",
  id: "00000000-0000-0000-0000-000000000000",
  name: { short: "OpenClaw" },
  developer: {
    name: "Sua Organização",
    websiteUrl: "https://example.com",
    privacyUrl: "https://example.com/privacy",
    termsOfUseUrl: "https://example.com/terms",
  },
  description: { short: "OpenClaw no Teams", full: "OpenClaw no Teams" },
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

- `bots[].botId` **deve** corresponder ao ID do aplicativo do Azure Bot.
- `webApplicationInfo.id` **deve** corresponder ao ID do aplicativo do Azure Bot.
- `bots[].scopes` deve incluir as superfícies que você pretende usar (`personal`, `team`, `groupChat`).
- `bots[].supportsFiles: true` é obrigatório para o processamento de arquivos no escopo pessoal.
- `authorization.permissions.resourceSpecific` deve incluir permissões de leitura/envio de canal para o tráfego dos canais.

### Atualização de um aplicativo existente

```bash
# Baixe, edite e reenvie o manifesto
teams app manifest download <teamsAppId> manifest.json
# Edite manifest.json localmente...
teams app manifest upload manifest.json <teamsAppId>
# A versão é incrementada automaticamente se o conteúdo tiver sido alterado
```

Após a atualização, reinstale o aplicativo em cada equipe e **encerre completamente e reinicie o Teams** (não apenas feche a janela) para limpar os metadados em cache do aplicativo.

<details>
<summary>Atualização manual do manifesto (sem a CLI)</summary>

1. Atualize `manifest.json` com as novas configurações.
2. **Incremente o campo `version`** (por exemplo, `1.0.0` → `1.1.0`).
3. **Crie novamente o arquivo zip** do manifesto com os ícones (`manifest.json`, `outline.png`, `color.png`).
4. Carregue o novo arquivo zip:
   - **Teams Admin Center:** Teams apps → Manage apps → encontre seu aplicativo → Upload new version.
   - **Sideload:** Teams → Apps → Manage your apps → Upload a custom app.

</details>

## Recursos: somente RSC em comparação com Graph

### Com **somente RSC do Teams** (aplicativo instalado, sem permissões da API do Graph)

Funciona:

- Ler o conteúdo de **texto** das mensagens do canal.
- Enviar conteúdo de **texto** às mensagens do canal.
- Receber anexos de arquivos **pessoais (mensagens diretas)**.

NÃO funciona:

- **Conteúdo de imagens ou arquivos** de canais/grupos (o payload inclui apenas um trecho HTML).
- Baixar anexos armazenados no SharePoint/OneDrive.
- Ler o histórico de mensagens além do evento Webhook em tempo real.

### Com **RSC do Teams + permissões de aplicativo do Microsoft Graph**

Adiciona:

- Download de conteúdo hospedado (imagens coladas nas mensagens).
- Download de anexos de arquivos armazenados no SharePoint/OneDrive.
- Leitura do histórico de mensagens de canais/chats pelo Graph.

### RSC em comparação com a API do Graph

| Recurso                    | Permissões RSC          | API do Graph                                      |
| -------------------------- | ----------------------- | ------------------------------------------------- |
| **Mensagens em tempo real**| Sim (via Webhook)       | Não (somente por sondagem)                        |
| **Mensagens históricas**   | Não                     | Sim (é possível consultar o histórico)            |
| **Complexidade da configuração** | Somente o manifesto do aplicativo | Exige consentimento do administrador + fluxo de token |
| **Funciona offline**       | Não (deve estar em execução) | Sim (consulte a qualquer momento)             |

**Em resumo:** o RSC serve para monitoramento em tempo real; a API do Graph serve para acesso ao histórico. Para recuperar mensagens perdidas enquanto estava offline, você precisa da API do Graph com `ChannelMessage.Read.All` (exige consentimento do administrador).

## Mídia + histórico habilitados pelo Graph

Habilite apenas as permissões de aplicativo do Microsoft Graph necessárias para os escopos e dados do Teams que você usa:

1. Entra ID (Azure AD) **App Registration** → adicione **Application permissions** do Graph:
   - `ChannelMessage.Read.All` para anexos e histórico de canais.
   - `Chat.Read.All` para anexos e histórico de chats em grupo.
   - `Files.Read.All` quando os bytes dos anexos precisarem ser baixados do armazenamento do SharePoint/OneDrive; configurações somente de histórico não precisam dessa permissão.
2. **Grant admin consent** para o locatário.
3. Incremente a **versão do manifesto** do aplicativo do Teams, reenvie-o e **reinstale o aplicativo no Teams**.
4. **Encerre completamente e reinicie o Teams** para limpar os metadados em cache do aplicativo.

### Recuperação de arquivos de canais/grupos (`graphMediaFallback`)

O Teams pode remover marcadores de arquivo da atividade HTML enviada a um bot. Nesse caso, a atividade do Bot Framework não pode ser distinguida de uma mensagem HTML comum; a referência completa do anexo existe apenas na cópia da mensagem no Graph.

Ative o fallback após conceder as permissões acima:

```json5
{
  channels: {
    msteams: {
      graphMediaFallback: true,
    },
  },
}
```

Isso se aplica somente a canais e chats em grupo. Ele adiciona uma consulta de mensagem ao Graph sempre que uma atividade HTML não produz mídia diretamente baixável, inclusive em mensagens comuns ou que contêm apenas menções. O padrão é `false`, para que instalações existentes não passem a gerar tráfego adicional no Graph nem erros de permissão automaticamente.

**Menções a usuários:** as @menções funcionam sem configuração adicional para usuários que já estão na conversa. Para pesquisar e mencionar dinamicamente usuários que **não estão na conversa atual**, adicione a permissão `User.Read.All` (Application) e conceda o consentimento do administrador.

## Limitações conhecidas

### Tempos limite de Webhook

O Teams entrega mensagens por meio de um Webhook HTTP. O OpenClaw aplica tempos limite fixos do servidor HTTP ao listener desse Webhook: 30s de inatividade, 30s para a solicitação total e 15s para receber os cabeçalhos. O enriquecimento opcional de mídia recebida e contexto tem um orçamento compartilhado de 10 segundos, mas o SDK do Teams ainda aguarda o turno do agente antes de retornar a resposta do Webhook. Se o turno completo exceder a janela de repetição do Teams, você poderá observar:

- O Teams tentando entregar a mensagem novamente (causando duplicatas).
- Respostas descartadas.

As respostas são enviadas de forma proativa assim que o agente responde, mas execuções lentas do agente ainda podem resultar em novas tentativas ou duplicatas no Teams.

### Suporte à nuvem do Teams e à URL de serviço

Este caminho do Teams baseado no SDK é validado em ambiente real para a nuvem pública do Microsoft Teams.

As respostas a mensagens recebidas usam o contexto do turno recebido do SDK do Teams. Operações proativas fora de contexto — envios, edições, exclusões, cartões, enquetes, mensagens de consentimento de arquivo e respostas enfileiradas de longa duração — usam o `serviceUrl` da referência de conversa armazenada. Por padrão, a nuvem pública usa o ambiente de nuvem pública do SDK do Teams e permite referências armazenadas no host público do Teams Connector: `https://smba.trafficmanager.net/`.

A nuvem pública é o padrão. Não é necessário definir `channels.msteams.cloud` nem `channels.msteams.serviceUrl` para bots comuns na nuvem pública.

Para nuvens não públicas do Teams, defina `cloud` e o limite proativo correspondente quando a Microsoft publicar um:

- `channels.msteams.cloud` seleciona a predefinição de nuvem do SDK do Teams para autenticação, validação de JWT, serviços de token e escopo do Graph.
- `channels.msteams.serviceUrl` seleciona o limite do endpoint do Bot Connector usado para validar referências de conversa armazenadas antes de envios, edições, exclusões, cartões, enquetes, mensagens de consentimento de arquivo e respostas enfileiradas de longa duração proativos. Ele é obrigatório para as nuvens USGov e DoD do SDK. Para China/21Vianet, o OpenClaw usa a predefinição `China` do SDK e aceita URLs de serviço armazenadas/configuradas somente em hosts de canal do Azure China Bot Framework.

A Microsoft publica os endpoints globais proativos do Bot Connector na seção [Criar a conversa](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages?tabs=dotnet#create-the-conversation) da documentação de mensagens proativas do Teams. Use o `serviceUrl` da atividade recebida quando estiver disponível; caso contrário, use a tabela da Microsoft abaixo.

| Ambiente do Teams | Configuração do OpenClaw                                    | `serviceUrl` proativa                              |
| ----------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Público           | nenhuma configuração de cloud/serviceUrl necessária         | `https://smba.trafficmanager.net/teams`            |
| GCC               | defina `serviceUrl`; não existe uma predefinição de nuvem GCC separada no SDK do Teams | `https://smba.infra.gcc.teams.microsoft.com/teams` |
| GCC High          | `cloud: "USGov"` + `serviceUrl`                             | `https://smba.infra.gov.teams.microsoft.us/teams`  |
| DoD               | `cloud: "USGovDoD"` + `serviceUrl`                          | `https://smba.infra.dod.teams.microsoft.us/teams`  |
| China/21Vianet    | `cloud: "China"`                                            | use a `serviceUrl` da atividade recebida            |

Exemplo para GCC, em que a Microsoft documenta uma URL de serviço proativa separada, mas o SDK do Teams não disponibiliza uma predefinição de nuvem GCC separada:

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

`channels.msteams.serviceUrl` é restrita aos hosts compatíveis do Microsoft Teams Bot Connector. Quando uma URL de serviço é configurada, o OpenClaw verifica se a `serviceUrl` armazenada da conversa usa o mesmo host antes da execução de envios proativos, edições, exclusões, cartões, enquetes ou respostas de longa duração enfileiradas. Com a configuração padrão da nuvem pública, o OpenClaw interrompe a operação com segurança se uma conversa armazenada apontar para fora do host público do Teams Connector. Após alterar as configurações de nuvem/URL de serviço, receba uma nova mensagem da conversa para que a referência armazenada da conversa esteja atualizada.

China/21Vianet não tem uma URL `smba` proativa global separada na tabela de endpoints proativos do Teams da Microsoft. Configure `cloud: "China"` para que o SDK do Teams use os endpoints de autenticação, token e JWT do Azure China. Os envios proativos passam então a exigir uma referência de conversa armazenada proveniente de uma atividade recebida do Teams da China, ou uma URL de serviço configurada explicitamente, no limite do canal do Azure China Bot Framework (`*.botframework.azure.cn`). Os auxiliares do Teams baseados no Graph ficam desabilitados para `cloud: "China"` até que o OpenClaw encaminhe as solicitações do Graph pelo endpoint do Azure China Graph.

### Formatação

O Markdown do Teams é mais limitado que o do Slack ou Discord:

- A formatação básica funciona: **negrito**, _itálico_, `code`, links.
- Markdown complexo (tabelas, listas aninhadas) pode não ser renderizado corretamente.
- Há suporte a Adaptive Cards para enquetes e envios de apresentação semântica (veja abaixo).

## Configuração

Principais configurações (consulte [/gateway/configuration](/pt-BR/gateway/configuration) para ver padrões compartilhados de canais):

- `channels.msteams.enabled`: habilita/desabilita o canal.
- `channels.msteams.appId`, `channels.msteams.appPassword`, `channels.msteams.tenantId`: credenciais do bot.
- `channels.msteams.cloud`: ambiente de nuvem do SDK do Teams (`Public`, `USGov`, `USGovDoD` ou `China`; padrão `Public`). Configure junto com `serviceUrl` para as nuvens do SDK USGov/DoD; a China usa a predefinição do SDK e referências de conversa armazenadas do Azure China Bot Framework, com auxiliares baseados no Graph desabilitados até que o roteamento do Graph para o Azure China seja disponibilizado.
- `channels.msteams.serviceUrl`: limite da URL de serviço do Bot Connector para operações proativas do SDK. A nuvem pública usa o padrão do SDK; configure para GCC (`https://smba.infra.gcc.teams.microsoft.com/teams`), GCC High ou DoD. A China aceita hosts de canal do Azure China Bot Framework quando a referência de conversa armazenada vem do Teams operado pela 21Vianet.
- `channels.msteams.webhook.port` (padrão `3978`).
- `channels.msteams.webhook.path` (padrão `/api/messages`).
- `channels.msteams.dmPolicy`: `pairing | allowlist | open | disabled` (padrão `pairing`).
- `channels.msteams.allowFrom`: lista de permissões para mensagens diretas (recomendam-se IDs de objeto do AAD). O assistente resolve nomes em IDs durante a configuração quando o acesso ao Graph está disponível.
- `channels.msteams.dangerouslyAllowNameMatching`: opção emergencial para reabilitar a correspondência por UPN/nome de exibição mutável e o roteamento direto por nome de equipe/canal.
- `channels.msteams.textChunkLimit`: tamanho dos segmentos de texto de saída em caracteres (padrão `4000`, com limite rígido de `4000`, independentemente de um valor configurado mais alto).
- `channels.msteams.streaming.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da segmentação por comprimento.
- `channels.msteams.mediaAllowHosts`: lista de permissões para hosts de anexos recebidos (o padrão são os domínios da Microsoft/Teams: Graph, SharePoint/OneDrive, CDN do Teams, Bot Framework e Azure Media Services).
- `channels.msteams.mediaAuthAllowHosts`: lista de permissões para anexar cabeçalhos Authorization em novas tentativas de mídia (o padrão são hosts do Graph + Bot Framework).
- `channels.msteams.graphMediaFallback`: permite consultas de mensagens no Graph quando o HTML do canal/grupo omite marcadores de arquivo (padrão `false`; consulte [Recuperação de arquivos de canal/grupo](#channelgroup-file-recovery-graphmediafallback)).
- `channels.msteams.mediaMaxMb`: substituição do limite de tamanho de mídia por canal em MB. Usa `agents.defaults.mediaMaxMb` como alternativa quando não definido.
- `channels.msteams.requireMention`: exige @menção em canais/grupos (padrão `true`).
- `channels.msteams.replyStyle`: `thread | top-level` (consulte [Estilo de resposta](#reply-style-threads-vs-posts)).
- `channels.msteams.teams.<teamId>.replyStyle`: substituição por equipe.
- `channels.msteams.teams.<teamId>.requireMention`: substituição por equipe.
- `channels.msteams.teams.<teamId>.tools`: substituições padrão da política de ferramentas por equipe (`allow`/`deny`/`alsoAllow`), usadas quando não há uma substituição de canal.
- `channels.msteams.teams.<teamId>.toolsBySender`: substituições padrão da política de ferramentas por remetente e por equipe (há suporte ao curinga `"*"`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.requireMention`: substituição por canal.
- `channels.msteams.teams.<teamId>.channels.<conversationId>.tools`: substituições da política de ferramentas por canal (`allow`/`deny`/`alsoAllow`).
- `channels.msteams.teams.<teamId>.channels.<conversationId>.toolsBySender`: substituições da política de ferramentas por remetente e por canal (há suporte ao curinga `"*"`).
- As chaves de `toolsBySender` devem usar prefixos explícitos: `channel:`, `id:`, `e164:`, `username:`, `name:` (chaves legadas sem prefixo ainda são mapeadas apenas para `id:`).
- `channels.msteams.authType`: tipo de autenticação — `"secret"` (padrão) ou `"federated"`.
- `channels.msteams.certificatePath`: caminho para o arquivo de certificado PEM (autenticação federada + certificado).
- `channels.msteams.certificateThumbprint`: impressão digital do certificado; aceita, mas não obrigatória para autenticação.
- `channels.msteams.useManagedIdentity`: habilita a autenticação com identidade gerenciada (modo federado).
- `channels.msteams.managedIdentityClientId`: ID do cliente para a identidade gerenciada atribuída pelo usuário.
- `channels.msteams.sharePointSiteId`: ID do site do SharePoint para uploads de arquivos em chats em grupo/canais (consulte [Envio de arquivos em chats em grupo](#sending-files-in-group-chats)).
- `channels.msteams.welcomeCard`, `channels.msteams.groupWelcomeCard`, `channels.msteams.promptStarters`: Adaptive Card de boas-vindas exibido no primeiro contato por mensagem direta/grupo e seus botões de prompts sugeridos.
- `channels.msteams.responsePrefix`: texto prefixado às respostas de saída.
- `channels.msteams.feedbackEnabled` (padrão `true`), `channels.msteams.feedbackReflection` (padrão `true`), `channels.msteams.feedbackReflectionCooldownMs`: feedback de positivo/negativo nas respostas e acompanhamento de reflexão sobre feedback negativo.
- `channels.msteams.sso`, `channels.msteams.delegatedAuth`: conexão OAuth do Bot Framework e escopos delegados do Graph para fluxos baseados em SSO; `sso.enabled: true` exige `sso.connectionName`.

## Roteamento e sessões

- As chaves de sessão seguem o formato padrão do agente (consulte [/concepts/session](/pt-BR/concepts/session)):
  - As mensagens diretas compartilham a sessão principal (`agent:<agentId>:<mainKey>`).
  - As mensagens de canal/grupo usam o ID da conversa:
    - `agent:<agentId>:msteams:channel:<conversationId>`
    - `agent:<agentId>:msteams:group:<conversationId>`

## Estilo de resposta: threads versus publicações

O Teams tem dois estilos de interface de canal sobre o mesmo modelo de dados subjacente:

| Estilo                     | Descrição                                                        | `replyStyle` recomendado |
| -------------------------- | ---------------------------------------------------------------- | ------------------------ |
| **Publicações** (clássico) | As mensagens aparecem como cartões com respostas encadeadas abaixo | `thread` (padrão)         |
| **Threads** (como no Slack) | As mensagens fluem linearmente, mais como no Slack               | `top-level`              |

**O problema:** a API do Teams não informa qual estilo de interface um canal usa. Se você usar o `replyStyle` incorreto:

- `thread` em um canal no estilo Threads → as respostas aparecem aninhadas de forma inadequada.
- `top-level` em um canal no estilo Publicações → as respostas aparecem como publicações separadas de nível superior, em vez de dentro do thread.

**Solução:** configure `replyStyle` por canal, com base em como o canal está configurado:

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

Quando o bot envia uma resposta para um canal, `replyStyle` é resolvido da substituição mais específica até o padrão. O primeiro valor diferente de `undefined` prevalece:

1. **Por canal** - `channels.msteams.teams.<teamId>.channels.<conversationId>.replyStyle`
2. **Por equipe** - `channels.msteams.teams.<teamId>.replyStyle`
3. **Global** - `channels.msteams.replyStyle`
4. **Padrão implícito** - derivado de `requireMention`:
   - `requireMention: true` → `thread`
   - `requireMention: false` → `top-level`

Se você definir `requireMention: false` globalmente sem um `replyStyle` explícito, as menções em canais no estilo Publicações serão exibidas como publicações de nível superior, mesmo quando a mensagem recebida for uma resposta em um thread. Fixe `replyStyle: "thread"` no nível global, da equipe ou do canal para evitar surpresas.

Para envios proativos a uma conversa de canal armazenada (respostas enfileiradas de chamadas de ferramenta, agentes de longa duração), aplica-se a mesma resolução de equipe/canal; chats em grupo e conversas pessoais (DM) sempre são resolvidos como `top-level` para envios proativos, independentemente de `replyStyle`.

### Preservação do contexto do thread

Quando `replyStyle: "thread"` está em vigor e o bot foi mencionado com @ dentro de um thread de canal, o OpenClaw reanexa a raiz original do thread à referência da conversa de saída (`19:...@thread.tacv2;messageid=<root>`) para que a resposta seja enviada dentro do mesmo thread. Isso vale tanto para envios ao vivo (durante o turno) quanto para envios proativos feitos após o contexto de turno do Bot Framework expirar (por exemplo, agentes de longa duração e respostas enfileiradas de chamadas de ferramenta via `mcp__openclaw__message`).

A raiz do thread é obtida do `threadId` armazenado na referência da conversa. Referências armazenadas mais antigas, anteriores ao `threadId`, recorrem ao `activityId` (a atividade recebida que inicializou a conversa mais recentemente), portanto as implantações existentes continuam funcionando sem uma nova inicialização.

Quando `replyStyle: "top-level"` está em vigor, mensagens recebidas em threads de canal são intencionalmente respondidas como novas publicações de nível superior; nenhum sufixo de thread é anexado. Isso é correto para canais no estilo Threads; publicações de nível superior quando você esperava respostas encadeadas significam que `replyStyle` está configurado incorretamente para esse canal.

## Anexos e imagens

**Limitações atuais:**

- **DMs:** imagens e anexos de arquivos funcionam por meio das APIs de arquivos de bot do Teams.
- **Canais/grupos:** os anexos ficam no armazenamento do M365 (SharePoint/OneDrive). A carga do webhook inclui apenas um trecho HTML, não os bytes reais do arquivo. **São necessárias permissões da API do Graph** para baixar anexos de canais.
- Para envios explícitos que priorizam o arquivo, use `action=upload-file` com `media` / `filePath` / `path`; o `message` opcional se torna o texto/comentário acompanhante, e `filename` (ou `title`) substitui o nome do arquivo enviado.

Sem permissões do Graph, mensagens de canal com imagens chegam somente como texto (o conteúdo da imagem não fica acessível ao bot).
Por padrão, o OpenClaw baixa mídia somente de nomes de host da Microsoft/Teams. Substitua isso com `channels.msteams.mediaAllowHosts` (use `["*"]` para permitir qualquer host).
Os cabeçalhos de autorização são anexados somente para hosts em `channels.msteams.mediaAuthAllowHosts` (o padrão inclui hosts do Graph e do Bot Framework). Mantenha essa lista restrita (evite sufixos multilocatário).

## Envio de arquivos em chats em grupo

Os bots podem enviar arquivos em DMs usando o fluxo integrado do FileConsentCard. **O envio de arquivos em chats em grupo/canais** exige configuração adicional:

| Contexto                  | Como os arquivos são enviados                     | Configuração necessária                              |
| ------------------------- | ------------------------------------------------- | ---------------------------------------------------- |
| **DMs**                   | FileConsentCard → o usuário aceita → o bot envia | Funciona sem configuração adicional                  |
| **Chats em grupo/canais** | Envio ao SharePoint → cartão de arquivo nativo   | Exige `sharePointSiteId` + permissões do Graph        |
| **Imagens (qualquer contexto)** | Incorporadas com codificação Base64          | Funciona sem configuração adicional                  |

### Por que chats em grupo precisam do SharePoint

Os bots usam uma identidade de aplicativo, enquanto o recurso `/me` do Microsoft Graph [exige um usuário conectado](https://learn.microsoft.com/en-us/graph/api/user-get?view=graph-rest-1.0). Para enviar arquivos em chats em grupo/canais, o bot faz o upload para um **site do SharePoint** e cria um link de compartilhamento.

### Configuração

1. **Adicione permissões da API do Graph** em Entra ID (Azure AD) → App Registration:
   - `Sites.ReadWrite.All` (Application) - fazer upload de arquivos para o SharePoint.
   - `Chat.Read.All` (Application) - opcional, habilita links de compartilhamento por usuário.
2. **Conceda consentimento do administrador** para o locatário.
3. **Obtenha o ID do seu site do SharePoint:**

   ```bash
   # Pelo Graph Explorer ou curl com um token válido:
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

| Permissão                               | Comportamento de compartilhamento                                    |
| --------------------------------------- | -------------------------------------------------------------------- |
| Somente `Sites.ReadWrite.All`           | Link de compartilhamento para toda a organização (qualquer pessoa na organização pode acessar) |
| `Sites.ReadWrite.All` + `Chat.Read.All` | Link de compartilhamento por usuário (somente membros do chat podem acessar) |

O compartilhamento por usuário é mais seguro, pois somente os participantes do chat podem acessar o arquivo. Se `Chat.Read.All` estiver ausente, o bot recorre ao compartilhamento para toda a organização.

### Comportamento alternativo

| Cenário                                                  | Resultado                                                   |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| Chat em grupo + arquivo + `sharePointSiteId` configurado | Faz upload para o SharePoint e envia um cartão de arquivo nativo |
| Chat em grupo + arquivo + sem `sharePointSiteId`         | Falha com um erro de configuração que indica como agir      |
| Chat pessoal + arquivo                                   | Fluxo do FileConsentCard (funciona sem SharePoint)          |
| Qualquer contexto + imagem                               | Incorporada com codificação Base64 (funciona sem SharePoint) |

### Local de armazenamento dos arquivos

Os arquivos enviados são armazenados em uma pasta `/OpenClawShared/` na biblioteca de documentos padrão do site do SharePoint configurado.

## Enquetes (Adaptive Cards)

O OpenClaw envia enquetes do Teams como Adaptive Cards (não existe uma API nativa de enquetes do Teams).

- CLI: `openclaw message poll --channel msteams --target conversation:<id> --poll-question "..." --poll-option "..." --poll-option "..."`.
- Os votos são registrados pelo Gateway no SQLite de estado do Plugin do OpenClaw em `state/openclaw.sqlite`.
- Arquivos `msteams-polls.json` existentes são importados por `openclaw doctor --fix`, não pelo Plugin em execução.
- O Gateway deve permanecer online para registrar votos.
- As enquetes não publicam automaticamente resumos dos resultados, e ainda não existe uma CLI de resultados de enquetes.

## Cartões de apresentação

Envie cargas semânticas de apresentação para usuários ou conversas do Teams usando a ferramenta `message`, a CLI ou a entrega normal de respostas. O OpenClaw as renderiza como Adaptive Cards do Teams a partir do contrato genérico de apresentação.

O parâmetro `presentation` aceita blocos semânticos. Quando `presentation` é fornecido, o texto da mensagem é opcional. Os botões são renderizados como ações de envio ou de URL do Adaptive Card. Os menus de seleção não são nativos no renderizador do Teams, portanto o OpenClaw os converte em texto legível antes da entrega.

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

Para obter detalhes sobre o formato do destino, consulte [Formatos de destino](#target-formats) abaixo.

## Formatos de destino

Os destinos do MSTeams usam prefixos para distinguir entre usuários e conversas:

| Tipo de destino      | Formato                          | Exemplo                                                                                                |
| -------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Usuário (por ID)     | `user:<aad-object-id>`           | `user:40a1a0ed-4ff2-4164-a219-55518990c197`                                                            |
| Usuário (por nome)   | `user:<display-name>`            | `user:John Smith` (exige a API do Graph)                                                               |
| Grupo/canal          | `conversation:<conversation-id>` | `conversation:19:abc123...@thread.tacv2`                                                               |
| Grupo/canal (bruto)  | `<conversation-id>`              | `19:abc123...@thread.tacv2`, `19:...@unq.gbl.spaces` ou um ID simples `a:`/`8:orgid:`/`29:` do Bot Framework |

**Exemplos de CLI:**

```bash
# Enviar para um usuário por ID
openclaw message send --channel msteams --target "user:40a1a0ed-..." --message "Hello"

# Enviar para um usuário pelo nome de exibição (aciona uma consulta à API do Graph)
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

<Note>
Sem o prefixo `user:`, os nomes usam por padrão a resolução de grupo ou equipe. Sempre use `user:` ao direcionar mensagens a pessoas pelo nome de exibição.
</Note>

## Mensagens proativas

- Mensagens proativas só são possíveis **depois** que um usuário interage, pois o OpenClaw armazena as referências da conversa nesse momento.
- Consulte [/gateway/configuration](/pt-BR/gateway/configuration) para saber mais sobre `dmPolicy` e o controle por lista de permissões.

## IDs de equipe e canal (problema comum)

O parâmetro de consulta `groupId` nas URLs do Teams **NÃO** é o ID da equipe usado na configuração. Em vez disso, extraia os IDs do caminho da URL:

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

**Para a configuração:**

- Chave da equipe = segmento do caminho após `/team/` (com a URL decodificada, por exemplo, `19:Bk4j...@thread.tacv2`; locatários mais antigos podem exibir `@thread.skype`, que também é válido).
- Chave do canal = segmento do caminho após `/channel/` (com a URL decodificada).
- **Ignore** o parâmetro de consulta `groupId` para o roteamento do OpenClaw. Ele é o ID do grupo do Microsoft Entra, não o ID de conversa do Bot Framework usado nas atividades recebidas do Teams.

## Canais privados

Os bots têm suporte limitado em canais privados:

| Recurso                         | Canais padrão | Canais privados            |
| ------------------------------- | ------------- | -------------------------- |
| Instalação do bot               | Sim           | Limitada                   |
| Mensagens em tempo real (Webhook) | Sim         | Podem não funcionar        |
| Permissões RSC                  | Sim           | Podem se comportar de modo diferente |
| @menções                        | Sim           | Se o bot estiver acessível |
| Histórico da API Graph          | Sim           | Sim (com permissões)       |

**Soluções alternativas caso os canais privados não funcionem:**

1. Use canais padrão para interações com o bot.
2. Use mensagens diretas; os usuários sempre podem enviar mensagens diretamente ao bot.
3. Use a API Graph para acessar o histórico (requer `ChannelMessage.Read.All`).

## Solução de problemas

### Problemas comuns

- **Imagens não aparecem nos canais:** faltam permissões do Graph ou consentimento do administrador. Reinstale o aplicativo do Teams, encerre-o completamente e abra-o novamente.
- **Sem respostas no canal:** as menções são obrigatórias por padrão; defina `channels.msteams.requireMention=false` ou configure por equipe/canal.
- **Incompatibilidade de versão (o Teams ainda exibe o manifesto antigo):** remova e adicione novamente o aplicativo e encerre completamente o Teams para atualizar.
- **401 Não autorizado do Webhook:** esperado ao testar manualmente sem um JWT do Azure; significa que o endpoint está acessível, mas a autenticação falhou. Use o Azure Web Chat para testar corretamente.

### Erros de upload do manifesto

- **"Icon file cannot be empty":** o manifesto referencia arquivos de ícone com 0 bytes. Crie ícones PNG válidos (32x32 para `outline.png`, 192x192 para `color.png`).
- **"webApplicationInfo.Id already in use":** o aplicativo ainda está instalado em outra equipe/conversa. Localize-o e desinstale-o primeiro ou aguarde 5-10 minutos pela propagação.
- **"Something went wrong" durante o upload:** faça o upload por [https://admin.teams.microsoft.com](https://admin.teams.microsoft.com), abra o DevTools do navegador (F12) → guia Network e verifique o corpo da resposta para identificar o erro real.
- **Falha no sideload:** tente "Upload an app to your org's app catalog" em vez de "Upload a custom app"; isso frequentemente contorna as restrições de sideload.

### Permissões RSC não funcionam

1. Verifique se `webApplicationInfo.id` corresponde exatamente ao ID do aplicativo do seu bot.
2. Faça novamente o upload do aplicativo e reinstale-o na equipe/conversa.
3. Verifique se o administrador da sua organização bloqueou as permissões RSC.
4. Confirme se você está usando o escopo correto: `ChannelMessage.Read.Group` para equipes, `ChatMessage.Read.Chat` para conversas em grupo.

## Referências

- [Criar um Azure Bot](https://learn.microsoft.com/en-us/azure/bot-service/bot-service-quickstart-registration) - guia de configuração do Azure Bot
- [Portal do Desenvolvedor do Teams](https://dev.teams.microsoft.com/apps) - criar/gerenciar aplicativos do Teams
- [Esquema do manifesto de aplicativo do Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/resources/schema/manifest-schema)
- [Receber mensagens de canal com RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/channel-messages-with-rsc)
- [Referência de permissões RSC](https://learn.microsoft.com/en-us/microsoftteams/platform/graph-api/rsc/resource-specific-consent)
- [Manipulação de arquivos por bots do Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/bots-filesv4) (canal/grupo requer o Graph)
- [Mensagens proativas](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/send-proactive-messages)
- [@microsoft/teams.cli](https://www.npmjs.com/package/@microsoft/teams.cli) - CLI do Teams para gerenciamento de bots

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) - todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) - autenticação por mensagem direta e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) - comportamento de conversas em grupo e exigência de menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) - roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) - modelo de acesso e proteção
