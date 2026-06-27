---
read_when:
    - Você quer usar Fireworks com OpenClaw
    - Você precisa da variável de ambiente da chave de API da Fireworks ou do ID do modelo padrão
    - Você está depurando o comportamento do Kimi com raciocínio desativado no Fireworks
summary: Configuração do Fireworks (autenticação + seleção de modelo)
title: Fireworks
x-i18n:
    generated_at: "2026-06-27T18:03:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7413ec9ea192921ce9b9ec51da5b0b9ff1030feeef192afbefc938ed200e192e
    source_path: providers/fireworks.md
    workflow: 16
---

[Fireworks](https://fireworks.ai) expõe modelos open-weight e roteados por meio de uma API compatível com OpenAI. Instale o Plugin oficial de provedor Fireworks para usar dois modelos Kimi pré-catalogados e qualquer modelo ou id de roteador Fireworks em tempo de execução.

| Propriedade            | Valor                                                  |
| ---------------------- | ------------------------------------------------------ |
| ID do provedor         | `fireworks` (alias: `fireworks-ai`)                    |
| Pacote                 | `@openclaw/fireworks-provider`                         |
| Var. de ambiente auth  | `FIREWORKS_API_KEY`                                    |
| Flag de onboarding     | `--auth-choice fireworks-api-key`                      |
| Flag direta da CLI     | `--fireworks-api-key <key>`                            |
| API                    | Compatível com OpenAI (`openai-completions`)           |
| URL base               | `https://api.fireworks.ai/inference/v1`                |
| Modelo padrão          | `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` |
| Alias padrão           | `Kimi K2.5 Turbo`                                      |

## Primeiros passos

<Steps>
  <Step title="Instale o plugin">
    ```bash
    openclaw plugins install @openclaw/fireworks-provider
    ```
  </Step>
  <Step title="Configure a chave de API da Fireworks">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice fireworks-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY"
```

```bash Env only
export FIREWORKS_API_KEY=fw-...
```

    </CodeGroup>

    O onboarding armazena a chave no provedor `fireworks` nos seus perfis de autenticação e define o roteador **Fire Pass** Kimi K2.5 Turbo como o modelo padrão.

  </Step>
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider fireworks
    ```

    A lista deve incluir `Kimi K2.6` e `Kimi K2.5 Turbo (Fire Pass)`. Se `FIREWORKS_API_KEY` não for resolvida, `openclaw models status --json` relata a credencial ausente em `auth.unusableProfiles`.

  </Step>
</Steps>

## Configuração não interativa

Para instalações com scripts ou CI, passe tudo pela linha de comando:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice fireworks-api-key \
  --fireworks-api-key "$FIREWORKS_API_KEY" \
  --skip-health \
  --accept-risk
```

## Catálogo integrado

| Ref. do modelo                                         | Nome                        | Entrada        | Contexto | Saída máx. | Raciocínio              |
| ------------------------------------------------------ | --------------------------- | -------------- | -------- | ---------- | ----------------------- |
| `fireworks/accounts/fireworks/models/kimi-k2p6`        | Kimi K2.6                   | texto + imagem | 262.144  | 262.144    | Forçado como desligado  |
| `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo` | Kimi K2.5 Turbo (Fire Pass) | texto + imagem | 256.000  | 256.000    | Forçado como desligado (padrão) |

<Note>
  O OpenClaw fixa todos os modelos Kimi da Fireworks em `thinking: off` porque a Fireworks rejeita parâmetros de raciocínio do Kimi em produção. Rotear o mesmo modelo diretamente pelo [Moonshot](/pt-BR/providers/moonshot) preserva a saída de raciocínio do Kimi. Consulte [modos de raciocínio](/pt-BR/tools/thinking) para alternar entre provedores.
</Note>

## IDs de modelo Fireworks personalizados

O OpenClaw aceita qualquer modelo ou id de roteador Fireworks em tempo de execução. Use o id exato mostrado pela Fireworks e prefixe-o com `fireworks/`. A resolução dinâmica clona o template Fire Pass (entrada de texto + imagem, API compatível com OpenAI, custo padrão zero) e desativa o raciocínio automaticamente quando o id corresponde ao padrão Kimi. IDs dinâmicos GLM são marcados como somente texto, a menos que você configure uma entrada de modelo personalizada com entrada de imagem.

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
  <Accordion title="Como funciona a prefixação de ids de modelo">
    Toda ref. de modelo Fireworks no OpenClaw começa com `fireworks/`, seguida pelo id exato ou caminho de roteador da plataforma Fireworks. Por exemplo:

    - Modelo de roteador: `fireworks/accounts/fireworks/routers/kimi-k2p5-turbo`
    - Modelo direto: `fireworks/accounts/fireworks/models/<model-name>`

    O OpenClaw remove o prefixo `fireworks/` ao construir a solicitação de API e envia o caminho restante para o endpoint Fireworks como o campo `model` compatível com OpenAI.

  </Accordion>

  <Accordion title="Por que o raciocínio é forçado como desligado para Kimi">
    Fireworks K2.6 retorna um 400 se a solicitação carrega parâmetros `reasoning_*`, embora o Kimi ofereça suporte a raciocínio pela própria API da Moonshot. A política de provedor (`extensions/fireworks/thinking-policy.ts`) anuncia apenas o nível de raciocínio `off` para ids de modelo Kimi, para que alternâncias manuais de `/think` e superfícies de política do provedor fiquem alinhadas ao contrato de runtime.

    Para usar o raciocínio do Kimi de ponta a ponta, configure o [provedor Moonshot](/pt-BR/providers/moonshot) e roteie o mesmo modelo por ele.

  </Accordion>

  <Accordion title="Disponibilidade do ambiente para o daemon">
    Se o Gateway for executado como um serviço gerenciado (launchd, systemd, Docker), a chave da Fireworks precisa estar visível para esse processo — não apenas para seu shell interativo.

    <Warning>
      Uma chave exportada apenas em um shell interativo não ajudará um daemon launchd ou systemd, a menos que esse ambiente também seja importado nele. Defina a chave em `~/.openclaw/.env` ou por meio de `env.shellEnv` para torná-la legível pelo processo do gateway.
    </Warning>

    No macOS, `openclaw gateway install` já conecta `~/.openclaw/.env` ao arquivo de ambiente do LaunchAgent. Execute a instalação novamente (ou `openclaw doctor --fix`) após rotacionar a chave.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedores de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs. de modelo e comportamento de failover.
  </Card>
  <Card title="Modos de raciocínio" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de `/think`, políticas de provedor e roteamento de modelos com capacidade de raciocínio.
  </Card>
  <Card title="Moonshot" href="/pt-BR/providers/moonshot" icon="moon">
    Execute o Kimi com saída de raciocínio nativa pela própria API da Moonshot.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e perguntas frequentes.
  </Card>
</CardGroup>
