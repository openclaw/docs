---
read_when:
    - Ativando resumos do HealthKit em um Node de iPhone
    - Invocação de health.summary ou solução de problemas de métricas de integridade ausentes
    - Analisando quais dados de saúde podem sair de um iPhone
summary: Ative e invoque resumos do HealthKit protegidos por privacidade a partir de um Node do iPhone
title: Resumos do HealthKit
x-i18n:
    generated_at: "2026-07-16T12:39:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 2f074c715ee1ef805ec953c301c03940e664c161f7f14c4388c83c64e222b557
    source_path: platforms/ios-healthkit.md
    workflow: 16
---

# Resumos do HealthKit

O OpenClaw pode solicitar a um node de iPhone conectado um resumo somente leitura do dia atual do calendário. O iPhone calcula o agregado no próprio dispositivo e retorna apenas passos, duração do sono, frequência cardíaca média em repouso e quantidade/duração dos treinos. Amostras individuais do HealthKit, fontes, metadados, registros clínicos, ingestão em segundo plano e gravações não são compatíveis.

Esse recurso vem desativado por padrão. Ele exige consentimento separado no iPhone e autorização no Gateway.

## Requisitos

- Um iPhone executando o aplicativo OpenClaw para iOS no qual o HealthKit informe que os dados de saúde estão disponíveis.
- Um node de iPhone conectado e aprovado. Consulte [configuração do aplicativo para iOS](/pt-BR/platforms/ios).
- Um Gateway atual que consiga acessar o node do iPhone.
- Dados legíveis do app Saúde para todas as métricas que se espera visualizar. Um Apple Watch pode fornecer dados ao armazenamento do app Saúde no iPhone, mas o aplicativo OpenClaw para watchOS não é necessário para os resumos do HealthKit.

## Habilitar o acesso

### 1. Autorizar o comando do Gateway

Adicione `health.summary` ao array `gateway.nodes.allowCommands` existente em
`openclaw.json`. Preserve todos os comandos já presentes:

```json5
{
  gateway: {
    nodes: {
      allowCommands: ["health.summary"],
    },
  },
}
```

`health.summary` é classificado como altamente sensível à privacidade e nunca é permitido pelo padrão da plataforma iOS. Uma entrada em `gateway.nodes.denyCommands` substitui a entrada de permissão. Consulte [Política de comandos do Node](/pt-BR/nodes#command-policy).

### 2. Habilitar o compartilhamento no iPhone

No aplicativo para iOS:

1. Abra **Settings -> Permissions -> Privacy & Access -> Health Summaries**.
2. Toque em **Enable & Share Summaries**.
3. Leia o aviso e escolha quais categorias do app Saúde o OpenClaw pode acessar na tela de permissões da Apple.

A opção registra sua escolha explícita de compartilhamento com o OpenClaw. Ela não afirma que a Apple concedeu acesso a todas as categorias solicitadas.

Habilitar os resumos de saúde adiciona `health.summary` à superfície de comandos declarada pelo node. Aprove a atualização resultante do emparelhamento do node:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

Em seguida, verifique se o iPhone conectado expõe um comando `health.summary` efetivo:

```bash
openclaw nodes describe --node "<iPhone name>"
```

## Solicitar o resumo de hoje

Somente `today` é compatível. Ele abrange desde a meia-noite local até o momento da solicitação, usando o calendário e o fuso horário atuais do iPhone.

```bash
openclaw nodes invoke \
  --node "<iPhone name>" \
  --command health.summary \
  --params '{"period":"today"}' \
  --json
```

Os agentes podem chamar o mesmo comando com a ferramenta `nodes`:

```json
{
  "action": "invoke",
  "node": "<iPhone name>",
  "invokeCommand": "health.summary",
  "invokeParamsJson": "{\"period\":\"today\"}"
}
```

O payload do resumo contém:

| Campo                    | Significado                                       |
| ------------------------ | ------------------------------------------------- |
| `period`                 | Sempre `today`                                   |
| `startISO`               | Início local do dia, codificado como um instante ISO |
| `endISO`                 | Horário da solicitação, codificado como um instante ISO |
| `timeZoneIdentifier`     | Identificador de fuso horário do iPhone           |
| `stepCount`              | Total acumulado de passos arredondado              |
| `sleepDurationMinutes`   | Tempo de sono sem duplicação, limitado ao dia atual |
| `restingHeartRateBpm`    | Frequência cardíaca média em repouso               |
| `workoutCount`           | Treinos iniciados hoje                             |
| `workoutDurationMinutes` | Duração total desses treinos                       |

Os campos de métricas são opcionais e são omitidos quando o HealthKit não retorna nenhum valor legível. Os estágios do sono e as fontes sobrepostas são combinados antes do cálculo da duração, portanto o mesmo minuto não é contabilizado duas vezes.

## Comportamento de privacidade

- A agregação ocorre no iPhone. As amostras brutas não saem do dispositivo.
- O agregado solicitado sai do iPhone por meio do Gateway. Quando um agente o solicita, o agregado chega ao provedor de IA configurado e pode permanecer no histórico do chat. Uma invocação direta pela CLI o retorna ao operador da CLI.
- O OpenClaw solicita apenas acesso de leitura. Ele não pode adicionar nem modificar dados do app Saúde.
- O OpenClaw acessa o HealthKit somente quando `health.summary` é invocado. Não há ingestão de dados de saúde em segundo plano.
- O HealthKit deliberadamente não revela se o acesso de leitura foi negado. Uma métrica ausente pode significar acesso negado, ausência de amostras correspondentes ou tipo de dado indisponível. O OpenClaw não consegue distinguir esses casos.
- O resumo se destina ao contexto pessoal de saúde e condicionamento físico, não a diagnósticos ou orientações médicas.

Para interromper o compartilhamento, volte a **Health Summaries** e toque em **Disable**. O iPhone removerá a funcionalidade de Saúde e o comando `health.summary` da superfície do node. Também é possível remover `health.summary` de
`gateway.nodes.allowCommands` para fechar o controle de acesso no lado do Gateway.

## Solução de problemas

### O comando não está declarado pelo node

Confirme se os resumos de saúde estão habilitados no aplicativo para iOS e se o iPhone está conectado. Execute `openclaw nodes pending`, aprove qualquer atualização de funcionalidade e inspecione `openclaw nodes describe --node "<iPhone name>"` novamente.

### O comando exige adesão explícita

Adicione `health.summary` a `gateway.nodes.allowCommands`. Verifique também se
`gateway.nodes.denyCommands` não o contém; a lista de negação prevalece.

### `HEALTH_ACCESS_DISABLED`

A opção de compartilhamento no aplicativo está desativada. Habilite **Health Summaries** em
**Privacy & Access** no iPhone.

### O resumo é obtido, mas há métricas ausentes

Abra o aplicativo Saúde da Apple e confirme se há dados de hoje. Revise o acesso do OpenClaw nos ajustes do app Saúde da Apple, mas não considere um resultado vazio como prova de que o acesso foi negado: o HealthKit oculta intencionalmente essa distinção.

### Intervalos anteriores falham

O comando aceita somente `{"period":"today"}`. Resumos de vários dias e históricos não são compatíveis.

## Relacionados

- [Aplicativo para iOS](/pt-BR/platforms/ios)
- [Nodes](/pt-BR/nodes)
- [Referência de configuração do Gateway](/pt-BR/gateway/configuration-reference#gateway)
- [Auditoria de segurança](/pt-BR/gateway/security)
