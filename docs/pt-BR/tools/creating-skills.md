---
read_when:
    - Você está criando uma nova skill personalizada no seu espaço de trabalho
    - Você precisa de um fluxo de trabalho inicial rápido para Skills baseadas em SKILL.md
summary: Crie e teste Skills personalizadas de workspace com SKILL.md
title: Criando Skills
x-i18n:
    generated_at: "2026-05-10T19:51:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: a468a0b21f4e43542b175b8acb8ad8b19dbbea06ce8e0b97c48206bf88a661c5
    source_path: tools/creating-skills.md
    workflow: 16
---

Skills ensinam ao agente como e quando usar ferramentas. Cada Skill é um diretório
contendo um arquivo `SKILL.md` com frontmatter YAML e instruções em markdown.

Para saber como Skills são carregadas e priorizadas, consulte [Skills](/pt-BR/tools/skills).

## Crie sua primeira Skill

<Steps>
  <Step title="Crie o diretório da Skill">
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

    Use formato com hífens, letras minúsculas, dígitos e hífens para o `name`
    da Skill. Mantenha o nome da pasta alinhado ao `name` do frontmatter.

  </Step>

  <Step title="Adicione ferramentas (opcional)">
    Você pode definir esquemas de ferramentas personalizados no frontmatter ou instruir o agente
    a usar ferramentas do sistema existentes (como `exec` ou `browser`). Skills também podem
    ser distribuídas dentro de plugins junto com as ferramentas que documentam.

  </Step>

  <Step title="Carregue a Skill">
    Inicie uma nova sessão para que o OpenClaw detecte a Skill:

    ```bash
    # From chat
    /new

    # Or restart the gateway
    openclaw gateway restart
    ```

    Verifique se a Skill foi carregada:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Teste-a">
    Envie uma mensagem que deve acionar a Skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Ou apenas converse com o agente e peça uma saudação.

  </Step>
</Steps>

## Referência de metadados da Skill

O frontmatter YAML aceita estes campos:

| Campo                               | Obrigatório | Descrição                                                       |
| ----------------------------------- | ----------- | --------------------------------------------------------------- |
| `name`                              | Sim         | Identificador único usando letras minúsculas, dígitos e hífens |
| `description`                       | Sim         | Descrição de uma linha mostrada ao agente                       |
| `metadata.openclaw.os`              | Não         | Filtro de SO (`["darwin"]`, `["linux"]`, etc.)                  |
| `metadata.openclaw.requires.bins`   | Não         | Binários obrigatórios no PATH                                   |
| `metadata.openclaw.requires.config` | Não         | Chaves de configuração obrigatórias                             |

## Práticas recomendadas

- **Seja conciso** — instrua o modelo sobre _o que_ fazer, não sobre como ser uma IA
- **Segurança em primeiro lugar** — se sua Skill usa `exec`, garanta que os prompts não permitam injeção arbitrária de comandos a partir de entrada não confiável
- **Teste localmente** — use `openclaw agent --message "..."` para testar antes de compartilhar
- **Use ClawHub** — navegue e contribua com Skills em [ClawHub](https://clawhub.ai)

## Onde Skills ficam

| Localização                     | Precedência | Escopo                         |
| ------------------------------- | ----------- | ------------------------------ |
| `\<workspace\>/skills/`         | Mais alta   | Por agente                     |
| `\<workspace\>/.agents/skills/` | Alta        | Agente por workspace           |
| `~/.agents/skills/`             | Média       | Perfil de agente compartilhado |
| `~/.openclaw/skills/`           | Média       | Compartilhado (todos os agentes) |
| Incluído (distribuído com o OpenClaw) | Baixa       | Global                         |
| `skills.load.extraDirs`         | Mais baixa  | Pastas compartilhadas personalizadas |

## Relacionado

- [Referência de Skills](/pt-BR/tools/skills) — regras de carregamento, precedência e controle
- [Configuração de Skills](/pt-BR/tools/skills-config) — esquema de configuração `skills.*`
- [ClawHub](/pt-BR/clawhub) — registro público de Skills
- [Criação de Plugins](/pt-BR/plugins/building-plugins) — plugins podem distribuir Skills
