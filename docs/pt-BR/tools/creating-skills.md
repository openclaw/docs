---
read_when:
    - Você está criando uma nova Skill personalizada no seu workspace
    - Você precisa de um fluxo inicial rápido para Skills baseadas em `SKILL.md`
summary: Criar e testar Skills personalizadas de workspace com `SKILL.md`
title: Criando Skills
x-i18n:
  refreshed_at: '2026-04-28T05:14:37Z'
    generated_at: "2026-04-24T06:15:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: df9249e14936c65143580a6618679cf2d79a2960390e5c7afc5dbea1a9a6e045
    source_path: tools/creating-skills.md
    workflow: 15
---

Skills ensinam o agente a usar ferramentas, e quando usá-las. Cada Skill é um diretório
contendo um arquivo `SKILL.md` com frontmatter YAML e instruções em markdown.

Para saber como as Skills são carregadas e priorizadas, consulte [Skills](/pt-BR/tools/skills).

## Crie sua primeira Skill

<Steps>
  <Step title="Criar o diretório da Skill">
    Skills ficam no seu workspace. Crie uma nova pasta:

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="Escrever SKILL.md">
    Crie `SKILL.md` dentro desse diretório. O frontmatter define metadados,
    e o corpo em markdown contém instruções para o agente.

    ```markdown
    ---
    name: hello_world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="Adicionar ferramentas (opcional)">
    Você pode definir schemas de ferramenta personalizados no frontmatter ou instruir o agente
    a usar ferramentas de sistema existentes (como `exec` ou `browser`). Skills também podem
    ser incluídas em plugins junto com as ferramentas que documentam.

  </Step>

  <Step title="Carregar a Skill">
    Inicie uma nova sessão para que o OpenClaw detecte a Skill:

    ```bash
    # A partir do chat
    /new

    # Ou reinicie o gateway
    openclaw gateway restart
    ```

    Verifique se a Skill foi carregada:

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="Testar">
    Envie uma mensagem que deve acionar a Skill:

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    Ou simplesmente converse com o agente e peça uma saudação.

  </Step>
</Steps>

## Referência de metadados de Skill

O frontmatter YAML oferece suporte a estes campos:

| Campo                               | Obrigatório | Descrição                                   |
| ----------------------------------- | ----------- | ------------------------------------------- |
| `name`                              | Sim         | Identificador único (`snake_case`)          |
| `description`                       | Sim         | Descrição de uma linha mostrada ao agente   |
| `metadata.openclaw.os`              | Não         | Filtro de SO (`["darwin"]`, `["linux"]` etc.) |
| `metadata.openclaw.requires.bins`   | Não         | Binários obrigatórios no PATH               |
| `metadata.openclaw.requires.config` | Não         | Chaves de configuração obrigatórias         |

## Boas práticas

- **Seja conciso** — instrua o modelo sobre _o que_ fazer, não sobre como ser uma IA
- **Segurança em primeiro lugar** — se sua Skill usa `exec`, garanta que prompts não permitam injeção arbitrária de comandos a partir de entrada não confiável
- **Teste localmente** — use `openclaw agent --message "..."` para testar antes de compartilhar
- **Use o ClawHub** — navegue e contribua com Skills em [ClawHub](https://clawhub.ai)

## Onde as Skills ficam

| Local                           | Precedência | Escopo                |
| ------------------------------- | ----------- | --------------------- |
| `\<workspace\>/skills/`         | Mais alta   | Por agente            |
| `\<workspace\>/.agents/skills/` | Alta        | Por agente do workspace |
| `~/.agents/skills/`             | Média       | Perfil de agente compartilhado |
| `~/.openclaw/skills/`           | Média       | Compartilhado (todos os agentes) |
| Integradas (enviadas com o OpenClaw) | Baixa | Global                |
| `skills.load.extraDirs`         | Mais baixa  | Pastas compartilhadas personalizadas |

## Relacionado

- [Referência de Skills](/pt-BR/tools/skills) — regras de carregamento, precedência e gating
- [Configuração de Skills](/pt-BR/tools/skills-config) — schema de configuração `skills.*`
- [ClawHub](/pt-BR/tools/clawhub) — registro público de Skills
- [Criando Plugins](/pt-BR/plugins/building-plugins) — plugins podem incluir Skills
