---
read_when:
    - Você quer conectar o OpenClaw ao SMS por meio da Twilio
    - Você precisa configurar o Webhook de SMS ou a lista de permissões
summary: Configuração do canal de SMS da Twilio, controles de acesso e configuração de webhook
title: SMS
x-i18n:
    generated_at: "2026-07-11T23:45:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ae0e0fee978a9837fc75ef7e9122bd06009df0d44de35fe9dff8aab120d5404
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw recebe e envia SMS por meio de um número de telefone ou Messaging Service da Twilio. O Gateway registra uma rota de Webhook de entrada (por padrão, `/webhooks/sms`), valida por padrão as assinaturas de solicitação da Twilio e envia as respostas pela API Messages da Twilio.

Status: Plugin oficial, instalado separadamente. Somente texto: sem MMS/mídia, apenas mensagens diretas.

<CardGroup cols={3}>
  <Card title="Emparelhamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de mensagens diretas para SMS é o emparelhamento.
  </Card>
  <Card title="Segurança do Gateway" icon="shield" href="/pt-BR/gateway/security">
    Revise a exposição do Webhook e os controles de acesso dos remetentes.
  </Card>
  <Card title="Solução de problemas de canais" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e procedimentos de reparo.
  </Card>
</CardGroup>

## Antes de começar

Você precisa de:

- O Plugin oficial de SMS instalado com `openclaw plugins install @openclaw/sms`.
- Uma conta da Twilio com um número de telefone compatível com SMS ou um Messaging Service da Twilio.
- O SID da conta e o token de autenticação da Twilio.
- Uma URL HTTPS pública que acesse seu Gateway do OpenClaw.
- Uma política de remetentes: `pairing` (padrão) para uso privado, `allowlist` para números de telefone previamente aprovados ou `open` somente para acesso por SMS intencionalmente público.

Um número da Twilio pode atender tanto a SMS quanto a [Chamadas de voz](/pt-BR/plugins/voice-call), caso tenha ambos os recursos. O Webhook de SMS e o Webhook de voz são configurados separadamente na Twilio e usam caminhos distintos do Gateway; esta página aborda somente o Webhook de SMS.

## Configuração rápida

<Steps>
  <Step title="Instale o Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Crie ou escolha um remetente da Twilio">
    Na Twilio, abra **Phone Numbers > Manage > Active numbers** e escolha um número compatível com SMS. Salve:

    - SID da conta, por exemplo, `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Token de autenticação
    - Número de telefone do remetente, por exemplo, `+15551234567`

    Se você usar um Messaging Service em vez de um número de remetente fixo, salve o SID do Messaging Service, por exemplo, `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Configure o canal de SMS">

Salve o conteúdo a seguir como `sms.patch.json5` e altere os espaços reservados:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Aplique-o:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Direcione a Twilio para o Webhook do Gateway">
    Nas configurações do número de telefone da Twilio, abra **Messaging** e defina **A message comes in** como:

```text
https://gateway.example.com/webhooks/sms
```

    Use HTTP `POST`. O caminho local padrão é `/webhooks/sms`; altere `channels.sms.webhookPath` se precisar de uma rota diferente.

  </Step>

  <Step title="Exponha o caminho exato do Webhook de SMS">
    Sua URL pública deve encaminhar o caminho de SMS ao processo do Gateway (porta padrão `18789`). Se você usar o Tailscale Funnel para testes locais, exponha `/webhooks/sms` explicitamente:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Chamadas de voz e SMS usam caminhos de Webhook distintos. Se o mesmo número da Twilio atender a ambos, mantenha as duas rotas configuradas na Twilio e no seu túnel.

  </Step>

  <Step title="Inicie o Gateway e aprove o primeiro remetente">

```bash
openclaw gateway
```

Envie uma mensagem de texto para o número da Twilio. A primeira mensagem cria uma solicitação de emparelhamento. Aprove-a:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Os códigos de emparelhamento expiram após 1 hora.

  </Step>
</Steps>

## Exemplos de configuração

Todas as chaves ficam em `channels.sms` (e, para cada conta, em `channels.sms.accounts.<id>`):

| Chave                                   | Padrão          | Finalidade                                                                         |
| --------------------------------------- | --------------- | ---------------------------------------------------------------------------------- |
| `enabled`                               | `true`          | Ativa ou desativa o canal/a conta.                                                 |
| `accountSid`                            | —               | SID da conta da Twilio (`AC...`).                                                  |
| `authToken`                             | —               | Token de autenticação da Twilio; texto simples ou SecretRef.                       |
| `fromNumber`                            | —               | Número do remetente no formato E.164.                                              |
| `messagingServiceSid`                   | —               | SID do Messaging Service (`MG...`) usado quando nenhum `fromNumber` é resolvido.   |
| `defaultTo`                             | —               | Destino padrão quando um fluxo de envio não especifica um destino explicitamente. |
| `webhookPath`                           | `/webhooks/sms` | Caminho HTTP do Gateway para Webhooks de entrada da Twilio.                        |
| `publicWebhookUrl`                      | —               | URL pública configurada na Twilio; obrigatória para validar assinaturas.           |
| `dangerouslyDisableSignatureValidation` | `false`         | Ignora as verificações de `X-Twilio-Signature`; somente para testes com túnel local. |
| `dmPolicy`                              | `"pairing"`     | `pairing`, `allowlist`, `open` ou `disabled`.                                      |
| `allowFrom`                             | `[]`            | Números de remetentes permitidos em E.164 ou `"*"` com `dmPolicy: "open"`.         |
| `textChunkLimit`                        | `1500`          | Máximo de caracteres por segmento de SMS enviado.                                  |
| `accounts`, `defaultAccount`            | —               | Mapa de múltiplas contas e identificador da conta padrão.                          |

### Arquivo de configuração

Use a configuração por arquivo quando quiser que a definição do canal acompanhe a configuração do Gateway:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

### Variáveis de ambiente

As variáveis de ambiente aplicam-se somente à conta padrão; os valores da configuração têm precedência sobre os valores do ambiente.

| Variável                                        | Corresponde a                                       |
| ----------------------------------------------- | --------------------------------------------------- |
| `TWILIO_ACCOUNT_SID`                            | `accountSid`                                        |
| `TWILIO_AUTH_TOKEN`                             | `authToken`                                         |
| `TWILIO_PHONE_NUMBER` (alias `TWILIO_SMS_FROM`) | `fromNumber`                                        |
| `TWILIO_MESSAGING_SERVICE_SID`                  | `messagingServiceSid`                               |
| `SMS_PUBLIC_WEBHOOK_URL`                        | `publicWebhookUrl`                                  |
| `SMS_WEBHOOK_PATH`                              | `webhookPath`                                       |
| `SMS_ALLOWED_USERS`                             | `allowFrom` (separado por vírgulas)                 |
| `SMS_TEXT_CHUNK_LIMIT`                          | `textChunkLimit`                                    |
| `SMS_DANGEROUSLY_DISABLE_SIGNATURE_VALIDATION`  | `dangerouslyDisableSignatureValidation` (`"true"`)  |

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Em seguida, ative o canal na configuração:

```json5
{
  channels: {
    sms: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

### Token de autenticação SecretRef

`authToken` pode ser uma SecretRef (`source: "env" | "file" | "exec"`). Use-a quando o Gateway precisar resolver o token de autenticação da Twilio por meio do ambiente de execução de segredos do OpenClaw, em vez de armazená-lo em texto simples na configuração:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: { source: "env", provider: "default", id: "TWILIO_AUTH_TOKEN" },
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

A variável de ambiente ou o provedor de segredos referenciado deve estar visível para o ambiente de execução do Gateway. Reinicie os processos gerenciados do Gateway após alterar as variáveis de ambiente do host.

### Remetente do Messaging Service

Use `messagingServiceSid` em vez de `fromNumber` quando a Twilio precisar escolher o remetente por meio de um Messaging Service:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      messagingServiceSid: "MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "pairing",
    },
  },
}
```

Se `fromNumber` e `messagingServiceSid` estiverem presentes após a resolução da configuração e do ambiente, `fromNumber` será usado.

### Destino padrão para envios

Defina `defaultTo` quando automações ou entregas iniciadas pelo agente precisarem de um destino padrão caso um fluxo de envio não especifique um destino explicitamente:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      defaultTo: "+15557654321",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
    },
  },
}
```

## Controle de acesso

`channels.sms.dmPolicy` controla o acesso direto por SMS:

- `pairing` (padrão): remetentes desconhecidos recebem um código de emparelhamento; aprove com `openclaw pairing approve sms <CODE>`.
- `allowlist`: somente os remetentes presentes em `allowFrom` são processados. Um `allowFrom` vazio rejeita todos os remetentes (o Gateway registra um aviso durante a inicialização).
- `open`: a validação da configuração exige que `allowFrom` inclua `"*"`. Sem o caractere curinga, somente os números listados podem conversar.
- `disabled`: todas as mensagens diretas de entrada são descartadas.

As entradas de `allowFrom` devem ser números de telefone no formato E.164, como `+15551234567`. Os prefixos `sms:` e `twilio-sms:` são aceitos e normalizados. Para um assistente privado, prefira `dmPolicy: "allowlist"` com números de telefone explícitos:

```json5
{
  channels: {
    sms: {
      enabled: true,
      accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      authToken: "twilio-auth-token",
      fromNumber: "+15551234567",
      publicWebhookUrl: "https://gateway.example.com/webhooks/sms",
      dmPolicy: "allowlist",
      allowFrom: ["+15557654321"],
    },
  },
}
```

## Envio de SMS

Com o canal de SMS selecionado, os destinos aceitam números E.164 sem prefixo ou com o prefixo `sms:`:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Quando a seleção do canal é implícita, o prefixo `twilio-sms:` seleciona este canal sem substituir o prefixo de serviço `sms:`, que o iMessage usa para selecionar a entrega por SMS da operadora para seus próprios destinos:

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

A CLI exige um `--target` explícito. `defaultTo` destina-se a automações e caminhos de entrega iniciados pelo agente nos quais o destino pode ser resolvido pela configuração do canal.

As respostas do agente em conversas de SMS recebidas retornam automaticamente ao remetente por meio do remetente configurado da Twilio.

A saída de SMS é texto simples. O OpenClaw remove Markdown, simplifica blocos de código delimitados, reescreve links como `rótulo (url)` e divide respostas longas em segmentos de no máximo `textChunkLimit` caracteres (1500 por padrão) antes de enviá-las pela Twilio.

## Verificar a configuração

Após o Gateway ser iniciado:

1. Confirme se o log do Gateway mostra a rota do Webhook de SMS.
2. Execute uma sondagem no lado da Twilio (verifica a URL/o método do Webhook da Twilio configurado e os erros recentes de mensagens recebidas):

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Envie um SMS do seu telefone para o número da Twilio.
4. Execute `openclaw pairing list sms`.
5. Aprove o código de pareamento com `openclaw pairing approve sms <CODE>`.
6. Envie outro SMS e confirme se o agente responde.

Para testes somente de saída, use:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Teste de ponta a ponta pelo iMessage/SMS do macOS

Em um Mac capaz de enviar SMS da operadora pelo Mensagens, você pode usar `imsg` para controlar o lado do remetente sem tocar no telefone:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

A primeira mensagem deve criar uma solicitação de pareamento. A segunda mensagem deve receber a resposta do agente pela Twilio.

## Segurança do Webhook

Por padrão, o OpenClaw valida `X-Twilio-Signature` usando `publicWebhookUrl` e `authToken`. Mantenha a parte do endpoint de `publicWebhookUrl` idêntica, byte por byte, à URL configurada na Twilio, incluindo esquema, host, caminho e string de consulta. O OpenClaw exclui da computação da assinatura os fragmentos de [substituição de conexão](https://www.twilio.com/docs/usage/webhooks/webhooks-connection-overrides) da Twilio (`#...`), conforme exigido pela Twilio.

A rota do Webhook também impõe, independentemente da validação da assinatura:

- Somente `POST`.
- Limite de 30 solicitações por minuto por IP de origem (HTTP 429 acima disso).
- O `AccountSid` da carga deve corresponder ao `accountSid` configurado (caso contrário, HTTP 403).
- Valores de `MessageSid` repetidos são desduplicados por 10 minutos.
- O cache de repetição de cada conta de SMS retém até 10.000 SIDs de mensagens ativos. Quando todos os espaços estão ativos, novos Webhooks dessa conta são rejeitados de forma segura com HTTP 429 e um cabeçalho `Retry-After` até que o espaço mais antigo expire.
- Corpos de solicitação acima de 32 KB são rejeitados.

Por padrão, a Twilio não repete solicitações após HTTP 429 nem documenta suporte a `Retry-After`. As substituições de conexão `#rp=4xx` e `#rp=all` habilitam repetições para respostas 4xx, mas a Twilio limita a transação completa de repetição a 15 segundos; portanto, as repetições ainda podem terminar antes que um espaço no cache de repetição expire. Configure uma URL alternativa quando outro manipulador precisar receber entregas que falharam; trate uma resposta 429 como uma rejeição segura, não como controle de fluxo confiável.

Somente para testes com túnel local, você pode definir:

```json5
{
  channels: {
    sms: {
      dangerouslyDisableSignatureValidation: true,
    },
  },
}
```

Não desative a validação de assinatura em um Gateway público.

## Configuração de várias contas

Use `accounts` ao operar mais de um número da Twilio:

```json5
{
  channels: {
    sms: {
      accounts: {
        support: {
          enabled: true,
          accountSid: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
          authToken: "twilio-auth-token",
          fromNumber: "+15551234567",
          publicWebhookUrl: "https://gateway.example.com/webhooks/sms/support",
          webhookPath: "/webhooks/sms/support",
          dmPolicy: "allowlist",
          allowFrom: ["+15557654321"],
        },
      },
    },
  },
}
```

Cada conta deve usar um `webhookPath` distinto; o Gateway se recusa a registrar uma rota de Webhook cujo caminho já pertença a outra conta. As alternativas por variáveis de ambiente `TWILIO_*`/`SMS_*` se aplicam somente à conta padrão; defina `defaultAccount` para alterar qual conta será a padrão.

## Solução de problemas

### A Twilio retorna 403 ou o OpenClaw rejeita o Webhook

Verifique se `publicWebhookUrl` corresponde exatamente à URL configurada na Twilio, incluindo esquema, host, caminho e string de consulta. A Twilio assina a string da URL pública; portanto, reescritas pelo proxy e nomes de host alternativos podem invalidar a assinatura.

Uma resposta 403 com `Invalid account` significa que o `AccountSid` da carga recebida não corresponde ao `accountSid` configurado; verifique se o Webhook aponta para a conta proprietária do número.

### Nenhuma solicitação de pareamento aparece

Verifique a URL e o método do Webhook de **Messaging** do número da Twilio. Ele deve apontar para a URL do Webhook de SMS e usar `POST`. Confirme também se o Gateway está acessível pela Internet pública ou por meio do seu túnel.

Se o log de mensagens da Twilio mostrar o erro `11200`, a Twilio aceitou o SMS recebido, mas não conseguiu acessar seu Webhook. Verifique:

- Na Twilio, **Messaging > A message comes in** aponta para `publicWebhookUrl`.
- O método é `POST`.
- O túnel ou proxy reverso expõe exatamente o `webhookPath`; para o Tailscale Funnel, execute `tailscale funnel status` e confirme se `/webhooks/sms` está listado.
- `publicWebhookUrl` usa o mesmo esquema, host, caminho e string de consulta enviados pela Twilio, para que a validação da assinatura possa reproduzir a URL assinada.

`openclaw channels status --channel sms --probe` apresenta tanto configurações divergentes do Webhook da Twilio quanto erros recentes `11200`.

### Falha no envio de mensagens

Confirme se `accountSid`, `authToken` e `fromNumber` ou `messagingServiceSid` foram resolvidos. Se você usa uma conta de avaliação da Twilio, talvez seja necessário verificar o número de destino na Twilio antes de enviar SMS.

### As mensagens chegam, mas o agente não responde

Verifique `dmPolicy` e `allowFrom`. Com a política padrão `pairing`, o remetente deve ser aprovado antes que as interações normais do agente sejam processadas.
