---
read_when:
    - Você quer uma chave gerenciada para vários provedores de modelos
    - Você precisa da descoberta de modelos do ClawRouter ou do relatório de cotas no OpenClaw
summary: Encaminhe modelos com escopo de credenciais pelo ClawRouter e mostre cotas gerenciadas
title: ClawRouter
x-i18n:
    generated_at: "2026-07-04T03:39:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 363426cc68e74f6a910f6fa956c323449ab827aee43db4320e98620245e593d2
    source_path: providers/clawrouter.md
    workflow: 16
---

O ClawRouter dá ao OpenClaw uma chave com escopo de política para vários
provedores de modelos upstream. O plugin integrado descobre apenas os modelos
permitidos para essa chave, roteia cada modelo pelo protocolo declarado e
relata o orçamento da chave e o uso agregado nas superfícies de uso do OpenClaw.

Você não instala nem autentica cada plugin de provedor upstream no host do
OpenClaw. As credenciais upstream e o encaminhamento específico de provedor
permanecem no ClawRouter. O OpenClaw precisa apenas do plugin integrado
`@openclaw/clawrouter` e de uma credencial ClawRouter emitida.

| Propriedade        | Valor                                    |
| ------------------ | ---------------------------------------- |
| Provedor           | `clawrouter`                             |
| Pacote             | `@openclaw/clawrouter`                   |
| Autenticação       | `CLAWROUTER_API_KEY`                     |
| URL padrão         | `https://clawrouter.openclaw.ai`         |
| Catálogo de modelos | Com escopo por credencial via `/v1/catalog` |
| Cotas              | Orçamento mensal e uso via `/v1/usage`  |

## Primeiros passos

<Steps>
  <Step title="Obtenha uma credencial com escopo">
    Peça ao administrador do ClawRouter uma credencial cuja política inclua
    os provedores, modelos e orçamento mensal que você deve usar. As credenciais
    são reveladas uma única vez quando emitidas.
  </Step>
  <Step title="Configure o OpenClaw">
    ```bash
    export CLAWROUTER_API_KEY="..."
    openclaw onboard --auth-choice clawrouter-api-key
    openclaw plugins enable clawrouter
    ```

    O plugin é integrado ao OpenClaw. Se sua configuração define
    `plugins.allow`, adicione `clawrouter` a essa lista antes de habilitá-lo. Para uma
    implantação personalizada, defina `models.providers.clawrouter.baseUrl` para a
    origem do ClawRouter; o padrão é `https://clawrouter.openclaw.ai`.

  </Step>
  <Step title="Liste os modelos concedidos">
    ```bash
    openclaw models list --all --provider clawrouter
    ```

    Use as referências de modelo retornadas exatamente como mostradas. Elas mantêm o
    namespace upstream, como `clawrouter/openai/...`, `clawrouter/anthropic/...` ou
    `clawrouter/google/...`. Se `agents.defaults.models` for uma lista de permissões na sua
    configuração, adicione cada referência ClawRouter selecionada a ela.

  </Step>
  <Step title="Selecione um modelo">
    ```bash
    openclaw models set clawrouter/<provider>/<model>
    ```

    Você também pode selecionar um modelo retornado para uma execução com
    `openclaw agent --model clawrouter/<provider>/<model> --message "..."`.

  </Step>
</Steps>

## Descoberta de modelos

`GET /v1/catalog` é a fonte da verdade. O OpenClaw não envia uma segunda lista
fixa de modelos ClawRouter. Um modelo configurado no ClawRouter aparece quando:

- a política da credencial concede seu provedor;
- a conexão do provedor está habilitada e pronta;
- o modelo do catálogo anuncia uma capacidade de LLM compatível; e
- o catálogo expõe um contrato de transporte compatível com o plugin.

Adicionar outro modelo a um provedor ClawRouter compatível, portanto, não
exige uma versão do OpenClaw nem outro plugin de provedor. A próxima atualização
do catálogo o descobre. Um modelo que precisa de um novo protocolo de fio exige
suporte no plugin ClawRouter antes que o OpenClaw o anuncie.

## Protocolo e plugins de provedor

Você não precisa instalar o plugin de autenticação de cada empresa upstream. O ClawRouter
é dono das credenciais upstream; seu catálogo informa ao OpenClaw qual transporte usar.
O plugin é compatível com:

| Rota do catálogo               | Transporte do OpenClaw  |
| ------------------------------ | ----------------------- |
| Chat compatível com OpenAI     | `openai-completions`    |
| Responses compatível com OpenAI | `openai-responses`      |
| Anthropic Messages nativo      | `anthropic-messages`    |
| Streaming nativo do Google Gemini | `google-generative-ai` |

O plugin também aplica as políticas correspondentes de replay e esquema de ferramentas para essas
famílias. Linhas do catálogo que usam outro formato de solicitação/stream são intencionalmente
não anunciadas como modelos de texto do OpenClaw. Normalize esses provedores para um dos
contratos compatíveis no ClawRouter em vez de enviar uma carga incompatível.

## Cotas e uso

A resposta `/v1/usage` do ClawRouter alimenta as superfícies normais de uso de provedor
do OpenClaw. `/status` e o status relacionado do painel mostram a janela de orçamento mensal
quando a chave tem um limite, além dos totais de solicitações, tokens e gastos. Chaves sem medição
ainda mostram o uso agregado sem uma janela percentual.

A consulta de cota usa a mesma chave com escopo da descoberta de modelos. Uma falha na consulta
de cota não bloqueia a execução do modelo.

Verifique o snapshot ativo com:

```bash
openclaw status --usage
openclaw models status
```

O mesmo snapshot de provedor está disponível para `/status` no chat e na UI de uso do OpenClaw.
O orçamento é amplo para toda a política, portanto solicitações feitas por outro cliente usando
a mesma política ClawRouter podem alterar o percentual restante.

## Solução de problemas

| Sintoma                                  | Verificação                                                                                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Nenhum modelo ClawRouter                 | Confirme que o plugin está habilitado e permitido por `plugins.allow`, depois verifique se a credencial está ativa e concede pelo menos um provedor pronto. |
| Um modelo ClawRouter configurado está ausente | Inspecione sua capacidade em `/v1/catalog` e o formato da rota. Contratos de transporte sem suporte são filtrados intencionalmente.             |
| `Unknown model: clawrouter/...`          | Adicione a referência exata do catálogo a `agents.defaults.models` quando esse mapa de configuração estiver sendo usado como lista de permissões. |
| `401` ou `403` do catálogo ou uso        | Reemita ou redefina o escopo da credencial ClawRouter; o OpenClaw não recorre a chaves de provedores upstream.                                  |
| A chamada do modelo falha após a descoberta | Verifique a conexão do provedor e a integridade upstream no ClawRouter, depois tente novamente após o estado de prontidão se recuperar.          |
| O uso tem totais, mas nenhum percentual  | A política não tem medição; adicione um orçamento mensal no ClawRouter para expor uma janela percentual.                                        |

## Comportamento de segurança

- A descoberta do catálogo tem escopo para a chave de proxy configurada e é armazenada em cache por chave.
- A chave de proxy é anexada apenas no despacho da solicitação; ela não é armazenada nos metadados do modelo.
- IDs de modelos nativos Anthropic e Gemini são reescritos para seus IDs upstream apenas no despacho.
- Linhas do catálogo sem suporte ou não concedidas falham fechadas e não são selecionáveis.

## Relacionado

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Configuração de provedor e seleção de modelo.
  </Card>
  <Card title="Rastreamento de uso" href="/pt-BR/concepts/usage-tracking" icon="chart-line">
    Superfícies de uso e status do OpenClaw.
  </Card>
</CardGroup>
