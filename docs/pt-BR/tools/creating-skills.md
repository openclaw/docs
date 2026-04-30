---
read_when:
    - Você está criando uma nova skill personalizada no seu espaço de trabalho
    - Você precisa de um fluxo de trabalho inicial rápido para Skills baseadas em SKILL.md
summary: Crie e teste Skills personalizadas do espaço de trabalho com SKILL.md
title: Criando Skills
x-i18n:
    generated_at: "2026-04-30T10:10:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 201718f4088f4243b0dabe12fb4fce4b8a7e64df9a4b7d651356ab4ae0dd3579
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills ensinam ao agente como e quando usar ferramentas. Cada skill é um diretório
que contém um arquivo `SKILL.md` com frontmatter YAML e instruções em markdown.

Para saber como Skills são carregadas e priorizadas, consulte [Skills](/pt-BR/tools/skills).

## Crie sua primeira skill

<Steps>
  <Step title="Crie o diretório da skill">
    Skills ficam no seu workspace. Crie uma nova pasta:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Escreva SKILL.md">
    Crie `SKILL.md` dentro desse diretório. O frontmatter define os metadados,
    e o corpo em markdown contém instruções para o agente.

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

    Use formato com hífens, letras minúsculas, dígitos e hífens para o
    `name` da skill. Mantenha o nome da pasta e o `name` do frontmatter alinhados.

  </Step>

  <Step title="Adicione ferramentas (opcional)">
    Você pode definir esquemas de ferramentas personalizados no frontmatter ou instruir o agente
    a usar ferramentas de sistema existentes (como `exec` ou `browser`). Skills também podem
    ser distribuídas dentro de plugins junto com as ferramentas que documentam.

  </Step>

  <Step title="Carregue a skill">
    Inicie uma nova sessão para que o OpenClaw detecte a skill:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Verifique se a skill foi carregada:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Teste">
    Envie uma mensagem que deve acionar a skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Ou simplesmente converse com o agente e peça uma saudação.

  </Step>
</Steps>

## Referência de metadados da skill

O frontmatter YAML aceita estes campos:

| Campo                               | Obrigatório | Descrição                                                    |
| ----------------------------------- | ----------- | ------------------------------------------------------------ |
| `name`                              | Sim         | Identificador único usando letras minúsculas, dígitos e hífens |
| `description`                       | Sim         | Descrição de uma linha mostrada ao agente                    |
| `metadata.openclaw.os`              | Não         | Filtro de SO (`["darwin"]`, `["linux"]`, etc.)               |
| `metadata.openclaw.requires.bins`   | Não         | Binários obrigatórios no PATH                                |
| `metadata.openclaw.requires.config` | Não         | Chaves de configuração obrigatórias                          |

## Práticas recomendadas

- **Seja conciso** — instrua o modelo sobre _o que_ fazer, não sobre como ser uma IA
- **Segurança em primeiro lugar** — se sua skill usa `exec`, garanta que os prompts não permitam injeção arbitrária de comandos a partir de entradas não confiáveis
- **Teste localmente** — use `openclaw agent --message "..."` para testar antes de compartilhar
- **Use ClawHub** — navegue e contribua com skills em [ClawHub](https://clawhub.ai)

## Onde Skills ficam

| Localização                     | Precedência | Escopo                       |
| ------------------------------- | ----------- | ---------------------------- |
| `\<workspace\>/skills/`         | Mais alta   | Por agente                   |
| `\<workspace\>/.agents/skills/` | Alta        | Agente por workspace         |
| `~/.agents/skills/`             | Média       | Perfil de agente compartilhado |
| `~/.openclaw/skills/`           | Média       | Compartilhado (todos os agentes) |
| Bundled (distribuído com o OpenClaw) | Baixa       | Global                       |
| `skills.load.extraDirs`         | Mais baixa  | Pastas compartilhadas personalizadas |

## Relacionado

- [Referência de Skills](/pt-BR/tools/skills) — regras de carregamento, precedência e controle de acesso
- [Configuração de Skills](/pt-BR/tools/skills-config) — esquema de configuração `skills.*`
- [ClawHub](/pt-BR/tools/clawhub) — registro público de skills
- [Criação de Plugins](/pt-BR/plugins/building-plugins) — plugins podem distribuir skills
