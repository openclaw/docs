---
read_when:
    - Você quer experimentar uma oferta promocional gratuita de um modelo do ClawHub
    - Você está configurando um provedor por meio de uma promoção em vez do processo de integração
summary: Referência da CLI para `openclaw promos` (listar e resgatar ofertas promocionais de modelos)
title: Promoções
x-i18n:
    generated_at: "2026-07-12T15:02:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

Descubra e resgate ofertas promocionais de modelos publicadas no ClawHub. O resgate de uma
promoção configura o provedor (autenticação e Plugin, quando necessário) e registra
os modelos da promoção — sem executar novamente a integração inicial e sem alterar
seu modelo padrão, a menos que você solicite.

Relacionado:

- Modelo padrão e alternativas: [Modelos](/pt-BR/cli/models)
- Configuração da autenticação do provedor: [Primeiros passos](/pt-BR/start/getting-started)

## Comandos

```bash
openclaw promos list
openclaw promos claim <slug>
openclaw promos claim <slug> --api-key <key> --set-default
```

## `openclaw promos list`

Lista as promoções que estão ativas no momento, com seus modelos, o padrão sugerido,
o tempo restante e o comando exato de resgate. `--json` imprime o payload
bruto.

## `openclaw promos claim <slug>`

Resgata uma promoção vigente:

1. Busca a promoção no ClawHub e verifica se ela está dentro do período de validade.
2. Valida o provedor, a opção de autenticação e os pacotes de plugins declarados pela promoção
   em relação à versão instalada do OpenClaw. IDs desconhecidos ou incompatibilidades de pacotes são
   recusados — uma promoção nunca pode fazer a CLI executar algo que ela ainda não
   saiba executar.
3. Reutiliza suas credenciais existentes do provedor, quando disponíveis. Caso contrário,
   conduz o fluxo normal de autenticação do provedor (exibindo primeiro a URL de cadastro da promoção
   para obter uma chave gratuita). `--api-key <key>` conclui a autenticação por chave de API sem
   prompts, de acordo com as flags não interativas de `openclaw onboard`; para não incluir a
   chave na linha de comando, exporte a variável de ambiente do provedor
   (por exemplo, `OPENROUTER_API_KEY`) — credenciais existentes no ambiente são
   detectadas automaticamente, sem necessidade de uma flag.
4. Registra os modelos da promoção com seus aliases. Aliases existentes
   nunca são sobrescritos.
5. Oferece a opção de definir o modelo sugerido pela promoção como seu padrão —
   `--set-default` pula a pergunta; caso contrário, nada em suas configurações padrão
   é alterado.

Quando o período da promoção termina, o provedor deixa de disponibilizar os modelos gratuitos;
sua configuração e suas credenciais permanecem inalteradas. Volte para outro modelo a qualquer momento com
`openclaw models set <model>`.

## Descoberta passiva em `models list`

`openclaw models list` também exibe promoções sem que você consulte o ClawHub
diretamente:

- Ofertas vigentes cujos modelos você ainda não configurou aparecem em um grupo
  "Disponível por meio de promoção" abaixo da tabela, cada uma com seu comando de
  resgate.
- Os modelos registrados por meio de `promos claim` recebem uma tag `promo`, que
  muda para `promo ended` quando o período da oferta termina.
- Na primeira vez que uma nova oferta é detectada, um aviso exibido uma única vez direciona para
  `openclaw promos list`. Ofertas que você já listou ou resgatou nunca são
  anunciadas novamente.

Isso lê uma cópia armazenada em cache localmente do feed de promoções hospedado pelo ClawHub
(normalmente atualizado uma vez por dia com uma solicitação condicional, ou antes, quando o
snapshot em cache expira; falhas de atualização são ignoradas silenciosamente). A atualização de um cache
obsoleto aguarda no máximo 2.5 segundos e nunca interrompe a listagem. As saídas `--json` e
`--plain` permanecem apropriadas para processamento por máquina: sem seções ou avisos de promoções.
O resgate sempre faz uma nova validação na API ativa do ClawHub; portanto, uma oferta retirada
antecipadamente é recusada mesmo que ainda apareça em uma cópia em cache.
