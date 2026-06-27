---
read_when:
    - Você quer conectar o OpenClaw ao SMS por meio do Twilio
    - Você precisa de configuração de Webhook de SMS ou lista de permissões
summary: Configuração do canal SMS da Twilio, controles de acesso e configuração de Webhook
title: SMS
x-i18n:
    generated_at: "2026-06-27T17:13:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0c384fa3374450aa3facc749791b5d59165d9daf0920ea5438ad412522166f52
    source_path: channels/sms.md
    workflow: 16
---

OpenClaw pode receber e enviar SMS por meio de um número de telefone Twilio ou de um Messaging Service. O Gateway registra uma rota de Webhook de entrada, valida assinaturas de solicitações Twilio por padrão e envia respostas de volta pela API Messages da Twilio.

<CardGroup cols={3}>
  <Card title="Emparelhamento" icon="link" href="/pt-BR/channels/pairing">
    A política padrão de DM para SMS é emparelhamento.
  </Card>
  <Card title="Segurança do Gateway" icon="shield" href="/pt-BR/gateway/security">
    Revise a exposição de Webhook e os controles de acesso de remetentes.
  </Card>
  <Card title="Solução de problemas de canal" icon="wrench" href="/pt-BR/channels/troubleshooting">
    Diagnósticos entre canais e playbooks de reparo.
  </Card>
</CardGroup>

## Antes de começar

Você precisa de:

- O Plugin oficial de SMS instalado com `openclaw plugins install @openclaw/sms`.
- Uma conta Twilio com um número de telefone compatível com SMS, ou um Twilio Messaging Service.
- O Account SID e o Auth Token da Twilio.
- Uma URL HTTPS pública que alcance seu OpenClaw Gateway.
- Uma escolha de política de remetente: `pairing` para uso privado, `allowlist` para números de telefone pré-aprovados, ou `open` somente para acesso SMS intencionalmente público.

Use um número Twilio para SMS e Voice Call se o número tiver ambas as capacidades. Configure o Webhook de SMS e o Webhook de Voice separadamente na Twilio; esta página cobre apenas o Webhook de SMS.

## Configuração rápida

<Steps>
  <Step title="Instale o Plugin">
    ```bash
    openclaw plugins install @openclaw/sms
    ```
  </Step>
  <Step title="Crie ou escolha um remetente Twilio">
    Na Twilio, abra **Phone Numbers > Manage > Active numbers** e escolha um número compatível com SMS. Salve:

    - Account SID, por exemplo `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
    - Auth Token
    - Número de telefone do remetente, por exemplo `+15551234567`

    Se você usar um Messaging Service em vez de um número de remetente fixo, salve o Messaging Service SID, por exemplo `MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`.

  </Step>

  <Step title="Configure o canal SMS">

Salve isto como `sms.patch.json5` e altere os placeholders:

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

Aplique:

```bash
openclaw config patch --file ./sms.patch.json5 --dry-run
openclaw config patch --file ./sms.patch.json5
```

  </Step>

  <Step title="Aponte a Twilio para o Webhook do Gateway">
    Nas configurações do número de telefone Twilio, abra **Messaging** e defina **A message comes in** como:

```text
https://gateway.example.com/webhooks/sms
```

    Use HTTP `POST`. O caminho local padrão é `/webhooks/sms`; altere `channels.sms.webhookPath` se precisar de uma rota diferente.

  </Step>

  <Step title="Exponha o caminho exato do Webhook de SMS">
    Sua URL pública deve rotear o caminho de SMS para o processo do Gateway. Se você usar Tailscale Funnel para testes locais, exponha `/webhooks/sms` explicitamente:

```bash
tailscale funnel --bg --set-path /webhooks/sms http://127.0.0.1:<gateway-port>/webhooks/sms
tailscale funnel status
```

    Voice Call e SMS usam caminhos de Webhook separados. Se o mesmo número Twilio lidar com ambos, mantenha ambas as rotas configuradas na Twilio e no seu túnel.

  </Step>

  <Step title="Inicie o Gateway e aprove o primeiro remetente">

```bash
openclaw gateway
```

Envie uma mensagem de texto para o número Twilio. A primeira mensagem cria uma solicitação de emparelhamento. Aprove-a:

```bash
openclaw pairing list sms
openclaw pairing approve sms <CODE>
```

    Códigos de emparelhamento expiram após 1 hora.

  </Step>
</Steps>

## Exemplos de configuração

### Arquivo de configuração

Use a configuração por arquivo de configuração quando quiser que a definição do canal acompanhe a configuração do Gateway:

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

Use a configuração por env para implantações de conta única em que os segredos vêm do ambiente do host:

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="<twilio-auth-token>"
export TWILIO_PHONE_NUMBER="+15551234567"
export SMS_PUBLIC_WEBHOOK_URL="https://gateway.example.com/webhooks/sms"
```

Depois habilite o canal na configuração:

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

`TWILIO_SMS_FROM` é aceito como um alias para `TWILIO_PHONE_NUMBER`. Use `TWILIO_MESSAGING_SERVICE_SID` em vez de um remetente por número de telefone quando a Twilio deve escolher o remetente a partir de um Messaging Service.

### Token de autenticação SecretRef

`authToken` pode ser um SecretRef. Use isso quando o Gateway deve resolver o Twilio Auth Token a partir do runtime de segredos do OpenClaw, em vez de armazenar configuração em texto claro:

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

A variável de ambiente ou o provedor de segredos referenciado deve estar visível para o runtime do Gateway. Reinicie processos gerenciados do Gateway após alterar variáveis de ambiente do host.

### Número privado somente com allowlist

Use `allowlist` quando somente números de telefone conhecidos devem poder falar com o agente:

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

### Remetente de Messaging Service

Use `messagingServiceSid` em vez de `fromNumber` quando a Twilio deve escolher o remetente por meio de um Messaging Service:

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

Se `fromNumber` e `messagingServiceSid` estiverem presentes após a resolução da configuração e do env, `fromNumber` será usado.

### Destino de saída padrão

Defina `defaultTo` quando automações ou entregas iniciadas pelo agente devem ter um destino padrão se um fluxo de envio omitir um destino explícito:

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

- `pairing` (padrão)
- `allowlist` (exige pelo menos um remetente em `allowFrom`)
- `open` (exige que `allowFrom` inclua `"*"`)
- `disabled`

Entradas de `allowFrom` devem ser números de telefone E.164, como `+15551234567`. Prefixos `sms:` são aceitos e normalizados. Para um assistente privado, prefira `dmPolicy: "allowlist"` com números de telefone explícitos.

## Envio de SMS

Destinos de SMS de saída usam o prefixo de serviço `sms:` com o canal SMS selecionado:

```bash
openclaw message send --channel sms --target sms:+15551234567 --message "hello"
```

Quando a seleção de canal é implícita, `twilio-sms:+15551234567` seleciona este canal sem assumir o prefixo de serviço `sms:` existente, pertencente ao canal, usado pelo iMessage.

```bash
openclaw message send --target twilio-sms:+15551234567 --message "hello"
```

A CLI exige um `--target` explícito. `defaultTo` é para automações e caminhos de entrega iniciados pelo agente em que o destino pode ser resolvido a partir da configuração do canal.

Respostas do agente de conversas SMS de entrada voltam automaticamente para o remetente por meio do remetente Twilio configurado.

A saída SMS é texto simples. OpenClaw remove markdown, achata blocos de código cercados, preserva links legíveis e divide respostas longas antes de enviá-las pela Twilio.

## Verificar configuração

Depois que o Gateway iniciar:

1. Confirme que o log do Gateway mostra a rota de Webhook de SMS.
2. Execute uma sondagem pelo lado da Twilio:

```bash
openclaw channels capabilities --channel sms
openclaw channels status --channel sms --probe --json
```

3. Envie um SMS para o número Twilio a partir do seu telefone.
4. Execute `openclaw pairing list sms`.
5. Aprove o código de emparelhamento com `openclaw pairing approve sms <CODE>`.
6. Envie outro SMS e confirme que o agente responde.

Para testes somente de saída, use:

```bash
openclaw message send --channel sms --target sms:+15557654321 --message "OpenClaw SMS test"
```

### Teste de ponta a ponta a partir do macOS iMessage/SMS

Em um Mac que pode enviar SMS de operadora pelo Messages, você pode usar `imsg` para conduzir o lado remetente sem tocar no telefone:

```bash
imsg send --to "+15551234567" --service sms --text "OpenClaw SMS E2E $(date -u +%Y%m%dT%H%M%SZ)" --json
openclaw pairing list sms
openclaw pairing approve sms <CODE>
imsg send --to "+15551234567" --service sms --text "reply exactly SMS pong" --json
```

A primeira mensagem deve criar uma solicitação de emparelhamento. A segunda mensagem deve receber a resposta do agente pela Twilio.

## Segurança de Webhook

Por padrão, OpenClaw valida `X-Twilio-Signature` usando `publicWebhookUrl` e `authToken`. Mantenha `publicWebhookUrl` alinhado byte a byte com a URL configurada na Twilio, incluindo esquema, host, caminho e string de consulta.

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

Não use validação de assinatura desabilitada em um Gateway público.

## Configuração de múltiplas contas

Use `accounts` quando operar mais de um número Twilio:

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

Cada conta deve usar um `webhookPath` distinto.

## Solução de problemas

### Twilio retorna 403 ou OpenClaw rejeita o Webhook

Verifique se `publicWebhookUrl` corresponde exatamente à URL configurada na Twilio, incluindo esquema, host, caminho e string de consulta. A Twilio assina a string de URL pública, então reescritas de proxy e nomes de host alternativos podem quebrar a validação de assinatura.

### Nenhuma solicitação de emparelhamento aparece

Verifique a URL e o método do Webhook de **Messaging** do número Twilio. Ele deve apontar para a URL do Webhook de SMS e usar `POST`. Confirme também que o Gateway está acessível pela internet pública ou pelo seu túnel.

Se o log de mensagens da Twilio mostrar o erro `11200`, a Twilio aceitou o SMS de entrada, mas não conseguiu alcançar seu Webhook. Verifique:

- Twilio **Messaging > A message comes in** aponta para `publicWebhookUrl`.
- O método é `POST`.
- O túnel ou proxy reverso expõe o `webhookPath` exato; para Tailscale Funnel, execute `tailscale funnel status` e confirme que `/webhooks/sms` está listado.
- `publicWebhookUrl` usa o mesmo esquema, host, caminho e string de consulta que a Twilio envia, para que a validação de assinatura possa reproduzir a URL assinada.

### Envios de saída falham

Confirme que `accountSid`, `authToken` e `fromNumber` ou `messagingServiceSid` estão resolvidos. Se você usa uma conta Twilio de avaliação, talvez o número de destino precise ser verificado na Twilio antes que SMS de saída sejam enviados.

### As mensagens chegam, mas o agente não responde

Verifique `dmPolicy` e `allowFrom`. Com a política `pairing` padrão, o remetente deve ser aprovado antes que turnos normais do agente sejam processados.
