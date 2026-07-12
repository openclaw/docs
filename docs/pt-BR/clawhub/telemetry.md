---
read_when:
    - Trabalhando nos controles de telemetria/privacidade
    - Dúvidas sobre quais dados são coletados
summary: Telemetria de instalação coletada pela CLI do ClawHub e como desativá-la.
x-i18n:
    generated_at: "2026-07-11T23:49:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

O ClawHub usa telemetria mínima da CLI para calcular contagens agregadas de instalações.

## Quando a telemetria é coletada

A telemetria só é enviada quando:

- Você está autenticado na CLI.
- Você executa `clawhub install <slug>`.
- A telemetria **não está desativada** (consulte “Como desativar” abaixo).

Se você não estiver autenticado, nada será relatado.

## O que coletamos

A cada execução relatada de `clawhub install`, a CLI envia um evento de instalação em regime de melhor esforço.

O evento inclui:

- `slug`: o slug da Skill instalada.
- `version`: a versão instalada, quando conhecida.

### O que _não_ coletamos

- Nenhum caminho de pasta ou identificador derivado de pastas.
- Nenhum conteúdo de arquivo.
- Nenhum log de execução, prompt ou outra saída da CLI.

## Contagens de instalações

O ClawHub mantém contadores agregados por Skill:

- `installsAllTime`: usuários únicos que relataram pelo menos uma instalação da Skill pela CLI.
- `installsCurrent`: usuários únicos que relataram uma instalação e não excluíram seus
  dados de telemetria.

## Transparência e controles do usuário

Todos veem apenas **contadores agregados de instalações**.

A exclusão da sua conta também exclui seus dados de telemetria.

## Como desativar a telemetria

Defina a variável de ambiente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Com essa variável definida, a CLI não enviará telemetria de instalação.
