---
read_when:
    - Você quer usar o Fireworks com o OpenClaw
    - Você precisa da variável de ambiente da chave da API da Fireworks ou do ID do modelo padrão
    - Você está depurando o comportamento de raciocínio desativado do Kimi no Fireworks
summary: Configuração do Fireworks (autenticação + seleção de modelo)
title: Fogos de artifício
x-i18n:
    generated_at: "2026-07-12T00:19:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 15feed0730ec65d943f103824468490be6616478ece80bedfeb9ad8137506180
    source_path: providers/fireworks.md
    workflow: 16
---

O [Fireworks](https://fireworks.ai) disponibiliza modelos de pesos abertos e roteados por meio de uma API compatível com a OpenAI. Instale o Plugin oficial do provedor Fireworks para usar dois modelos Kimi pré-catalogados e qualquer modelo ou identificador de roteador do Fireworks em tempo de execução.

| Propriedade                  | Valor                                                  |
| ---------------------------- | ------------------------------------------------------ |
| Identificador do provedor    | `fireworks` (alias: `fireworks-ai`)                    |
| Pacote                       | `@openclaw/fireworks-provider`                         |
| Variável de ambiente de autenticação | `FIREWORKS_API_KEY`                            |
| Flag de integração inicial   | `--auth-choice fireworks-api-key`                      |
| Flag direta da CLI           | `--fireworks-api-key <key>`                            |
| API                          | Compatível com a OpenAI (`openai-completions`)         |
| URL base                     | `https://api.fireworks.ai/inference/v1`                |
| Modelo padrão                | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias padrão                 | `Kimi K2.5 Turbo`                                      |

## Primeiros passos

<Steps>
  <Step title="Instale o Plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Defina a chave da API do Fireworks">
    <CodeGroup>

```bash Integração inicial
openclaw onboard --auth-choice fireworks-api-key
```

```bash Flag direta
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Somente variável de ambiente
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    A integração inicial armazena a chave para o provedor `fireworks` nos seus perfis de autenticação e define o roteador Kimi K2.5 Turbo **Fire Pass** como o modelo padrão.

  </Step>
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider fireworks
    ```

    A lista deve incluir `Kimi K2.6` e `Kimi K2.5 Turbo (Fire Pass)`. Se `FIREWORKS_API_KEY` não puder ser resolvida, `openclaw models status --json` informará a credencial ausente em `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuração não interativa

Para instalações automatizadas ou de CI, forneça tudo na linha de comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Referência do modelo                                  | Nome                        | Entrada        | Contexto | Saída máxima | Raciocínio                  |
| ------------------------------------------------------ | --------------------------- | -------------- | -------- | ------------ | -------------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | texto + imagem | 262.144  | 262.144      | Forçado a ficar desativado |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | texto + imagem | 256.000  | 256.000      | Forçado a ficar desativado (padrão) |

<Note>
  O OpenClaw fixa todos os modelos Kimi do Fireworks em `thinking: off`, pois o Kimi no Fireworks pode expor a cadeia de raciocínio na resposta visível, a menos que a solicitação desative explicitamente o raciocínio. Rotear o mesmo modelo diretamente pelo [Moonshot](/pt-BR/providers/moonshot) preserva a saída de raciocínio do Kimi. Consulte os [modos de raciocínio](/pt-BR/tools/thinking) para alternar entre provedores.
</Note>

## Identificadores personalizados de modelos do Fireworks

O OpenClaw aceita qualquer identificador de modelo ou roteador do Fireworks em tempo de execução. Use o identificador exato exibido pelo Fireworks e adicione o prefixo `fireworks/`. A resolução dinâmica clona o modelo de referência do Fire Pass (entrada de texto + imagem, API compatível com a OpenAI, custo padrão zero) e desativa automaticamente o raciocínio quando o identificador corresponde ao padrão do Kimi. Identificadores dinâmicos do GLM são marcados como exclusivos para texto, a menos que você configure uma entrada de modelo personalizada com entrada de imagem.

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "fireworks/accounts/fireworks/models/<your-model-id>",
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Como funciona o prefixo do identificador do modelo">
    Toda referência de modelo do Fireworks no OpenClaw começa com `fireworks/`, seguido pelo identificador ou caminho de roteador exato da plataforma Fireworks. Por exemplo:

    - Modelo de roteador: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modelo direto: `fireworks/accounts/fireworks/models/<model-name>`

    O OpenClaw remove o prefixo `fireworks/` ao construir a solicitação da API e envia o caminho restante ao endpoint do Fireworks como o campo `model` compatível com a OpenAI.

  </Accordion>

  <Accordion title="Por que o raciocínio é forçado a ficar desativado para o Kimi">
    O Fireworks disponibiliza o Kimi sem um canal de raciocínio separado, portanto a cadeia de raciocínio pode aparecer no fluxo visível de `content`. Em cada solicitação do Kimi ao Fireworks, o OpenClaw envia `thinking: { type: "disabled" }` e remove `reasoning`, `reasoning_effort` e `reasoningEffort` da carga útil (`extensions/fireworks/stream.ts`). A política do provedor (`extensions/fireworks/thinking-policy.ts`) anuncia apenas o nível de raciocínio `off` para identificadores de modelos Kimi, mantendo as alterações manuais de `/think` e as superfícies de política do provedor alinhadas ao contrato de tempo de execução.

    Para usar o raciocínio do Kimi de ponta a ponta, configure o [provedor Moonshot](/pt-BR/providers/moonshot) e roteie o mesmo modelo por ele.

  </Accordion>

  <Accordion title="Disponibilidade do ambiente para o daemon">
    Se o Gateway for executado como um serviço gerenciado (launchd, systemd, Docker), a chave do Fireworks deverá estar visível para esse processo — não apenas para o seu shell interativo.

    <Warning>
      Uma chave exportada somente em um shell interativo não ajudará um daemon do launchd ou systemd, a menos que esse ambiente também seja importado nele. Defina a chave em `~/.openclaw/.env` ou por meio de `env.shellEnv` para torná-la legível pelo processo do Gateway.
    </Warning>

    O OpenClaw carrega `~/.openclaw/.env` ao carregar a configuração, portanto as chaves armazenadas nesse arquivo chegam aos serviços gerenciados do Gateway em todas as plataformas. Reinicie o Gateway (ou execute `openclaw doctor --fix` novamente) após trocar a chave.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher provedores, referências de modelos e o comportamento de failover.
  </Card>
  <Card title="Modos de raciocínio" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de `/think`, políticas de provedores e roteamento de modelos com capacidade de raciocínio.
  </Card>
  <Card title="Moonshot" href="/pt-BR/providers/moonshot" icon="moon">
    Execute o Kimi com a saída de raciocínio nativa pela própria API do Moonshot.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas gerais e perguntas frequentes.
  </Card>
</CardGroup>
