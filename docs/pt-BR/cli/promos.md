---
read_when:
    - Você quer experimentar uma oferta promocional gratuita de um modelo do ClawHub
    - Você está configurando um provedor por meio de uma promoção em vez do processo de integração
summary: Referência da CLI para `openclaw promos` (listar e resgatar ofertas promocionais de modelos)
title: Promoções
x-i18n:
    generated_at: "2026-07-11T23:52:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

Descubra e resgate ofertas promocionais de modelos publicadas no ClawHub. Resgatar uma
promoção configura o provedor (autenticação e Plugin, quando necessário) e registra
os modelos da promoção — sem executar novamente a integração inicial e sem alterar
seu modelo padrão, a menos que você solicite.

Relacionado:

- Modelo padrão e fallbacks: [Modelos](/pt-BR/cli/models)
- Configuração da autenticação do provedor: [Primeiros passos](/pt-BR/start/getting-started)

## Comandos

```bash
openclaw promos list
openclaw promos claim <slug>
openclaw promos claim <slug> --api-key <key> --set-default
```

## `openclaw promos list`

Lista as promoções disponíveis no momento, com seus modelos, a opção padrão
sugerida, o tempo restante e o comando exato para resgate. `--json` imprime o
payload bruto.

## `openclaw promos claim <slug>`

Resgata uma promoção disponível:

1. Obtém a promoção no ClawHub e verifica se ela está dentro do período de validade.
2. Valida o provedor, a opção de autenticação e os pacotes de Plugin declarados pela
   promoção em relação à sua versão instalada do OpenClaw. IDs desconhecidos ou
   incompatibilidades de pacotes são recusados — uma promoção nunca pode fazer a CLI
   executar algo que ela ainda não saiba executar.
3. Reutiliza suas credenciais existentes do provedor, caso você as tenha. Caso
   contrário, conduz você pelo fluxo normal de autenticação do provedor (primeiro
   exibindo a URL de cadastro da promoção para obter uma chave gratuita).
   `--api-key <key>` conclui a autenticação por chave de API sem solicitações,
   de forma compatível com as opções não interativas de `openclaw onboard`; para
   não expor a chave na linha de comando, exporte a variável de ambiente do provedor
   (por exemplo, `OPENROUTER_API_KEY`) — as credenciais existentes no ambiente são
   detectadas automaticamente, sem necessidade de nenhuma opção.
4. Registra os modelos da promoção com seus aliases. Aliases existentes nunca são
   sobrescritos.
5. Oferece a opção de definir o modelo sugerido pela promoção como seu padrão —
   `--set-default` ignora a pergunta; caso contrário, nenhuma configuração padrão
   será alterada.

Quando o período da promoção termina, o provedor deixa de disponibilizar os modelos
gratuitos; sua configuração e suas credenciais permanecem inalteradas. Volte para
outro modelo a qualquer momento com `openclaw models set <model>`.

## Descoberta passiva em `models list`

`openclaw models list` também exibe promoções sem que você consulte diretamente o
ClawHub:

- Ofertas disponíveis cujos modelos você ainda não configurou aparecem em um grupo
  "Disponíveis via promoção" abaixo da tabela, cada uma com seu comando de resgate.
- Os modelos registrados por meio de `promos claim` recebem uma tag `promo`, que
  muda para `promo encerrada` quando o período da oferta termina.
- Na primeira vez que uma nova oferta é detectada, um aviso único indica
  `openclaw promos list`. Ofertas que você já listou ou resgatou nunca são
  anunciadas novamente.

Esse recurso lê uma cópia armazenada em cache local do feed de promoções hospedado
pelo ClawHub (normalmente atualizada uma vez por dia por meio de uma solicitação
condicional, ou antes disso quando o snapshot em cache expira; falhas de atualização
são ignoradas silenciosamente). Uma atualização de dados obsoletos aguarda no
máximo 2,5 segundos e nunca interrompe a listagem. As saídas de `--json` e
`--plain` permanecem adequadas para processamento por máquina: sem seções ou avisos
de promoções. O resgate sempre faz uma nova validação com a API ativa do ClawHub;
portanto, uma oferta retirada antecipadamente é recusada, mesmo que uma cópia em
cache ainda a exiba.
