---
read_when:
    - Trabalhando em controles de telemetria / privacidade
    - Dúvidas sobre quais dados são coletados
summary: Instale a telemetria coletada pela CLI do ClawHub e veja como desativá-la.
x-i18n:
    generated_at: "2026-07-04T15:10:47Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 906be32778baaf89e77c5350cd33ff3b975df66d8152a33fdf20c24b5c8286ce
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetria

ClawHub usa telemetria mínima da CLI para calcular contagens agregadas de instalações.

## Quando a telemetria é coletada

A telemetria só é enviada quando:

- Você está conectado na CLI.
- Você executa `clawhub install <slug>`.
- A telemetria **não está desativada** (veja “Como desativar” abaixo).

Se você não estiver conectado, nada será relatado.

## O que coletamos

Em cada `clawhub install` relatado, a CLI envia um evento de instalação com melhor esforço.

O evento inclui:

- `slug`: o slug da skill instalada.
- `version`: a versão instalada, quando conhecida.

### O que _não_ coletamos

- Nenhum caminho de pasta ou identificador derivado de pasta.
- Nenhum conteúdo de arquivo.
- Nenhum log por execução, prompt ou outra saída da CLI.

## Contagens de instalações

ClawHub mantém contadores agregados por skill:

- `installsAllTime`: usuários únicos que relataram pelo menos uma instalação via CLI da skill.
- `installsCurrent`: usuários únicos que relataram uma instalação e não excluíram sua
  telemetria.

## Transparência + controles do usuário

Todos veem apenas **contadores agregados de instalações**.

Excluir sua conta também exclui seus dados de telemetria.

## Como desativar a telemetria

Defina a variável de ambiente:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Com isso definido, a CLI não enviará telemetria de instalação.
