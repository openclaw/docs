---
read_when:
    - Trabalhando em controles de telemetria e privacidade
    - Dúvidas sobre quais dados são coletados
summary: Telemetria de instalação coletada pela CLI do ClawHub e como desativá-la.
x-i18n:
    generated_at: "2026-07-12T21:31:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

O ClawHub usa telemetria mínima da CLI para calcular contagens agregadas de instalações.

## Quando a telemetria é coletada

A telemetria só é enviada quando:

- Você está conectado à CLI.
- Você executa `clawhub install <slug>`.
- A telemetria **não está desativada** (consulte “Como desativar” abaixo).

Se você não estiver conectado, nada será informado.

## O que coletamos

A cada `clawhub install` informado, a CLI envia um evento de instalação em regime de melhor esforço.

O evento inclui:

- `slug`: o slug da skill instalada.
- `version`: a versão instalada, quando conhecida.

### O que _não_ coletamos

- Nenhum caminho de pasta ou identificador derivado de pastas.
- Nenhum conteúdo de arquivo.
- Nenhum log por execução, prompt ou outra saída da CLI.

## Contagens de instalações

O ClawHub mantém contadores agregados por skill:

- `installsAllTime`: usuários únicos que informaram pelo menos uma instalação da skill pela CLI.
- `installsCurrent`: usuários únicos que informaram uma instalação e não excluíram seus
  dados de telemetria.

## Transparência e controles do usuário

Todos veem apenas **contadores agregados de instalações**.

Excluir sua conta também exclui seus dados de telemetria.

## Como desativar a telemetria

Defina a variável de ambiente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Com essa variável definida, a CLI não enviará telemetria de instalação.
