const apiKeyInput = document.getElementById('apiKey')
const gameSelect = document.getElementById('gameSelect')
const questionInput = document.getElementById('questionInput')
const askButton = document.getElementById('askButton')
const aiResponse = document.getElementById('aiResponse')
const form = document.getElementById('form')

const markdownToHTML = (text) => {
    const converter = new showdown.Converter()
    return converter.makeHtml(text)
}

const perguntarAI = async (question, game, apiKey) => {
    const model = 'gemini-3.6-flash'

    const geminiURL =
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

    const dataHoje = new Date().toLocaleDateString('pt-BR')

    const prompts = {
        lol: `
## Especialidade
Você é um assistente especialista em League of Legends.

## Tarefa
Responda sobre estratégias, builds, campeões, runas e dicas de jogo.

## Regras
- Se não souber, diga "Não sei".
- Se a pergunta não for sobre League of Legends, diga "Essa pergunta não está relacionada ao jogo".
- Data de hoje: ${dataHoje}.
- Não invente informações nem afirme que verificou o patch atual se não tiver essa informação.

## Resposta
- Seja direto, com no máximo 200 caracteres.
- Use Markdown.
- Não use saudações nem despedidas.

Pergunta: ${question}
`,
        valorant: `
## Especialidade
Você é um assistente tático e estratégico de Valorant.

## Tarefa
Responda sobre agentes, estratégias, mapas, economia e dicas de jogo.

## Regras
- Se não souber, diga "Não sei".
- Se a pergunta não for sobre Valorant, diga "Essa pergunta não está relacionada ao jogo".
- Data de hoje: ${dataHoje}.
- Não invente informações nem afirme que verificou o patch atual se não tiver essa informação.

## Resposta
- Seja direto, com no máximo 200 caracteres.
- Use Markdown.
- Não use saudações nem despedidas.

Pergunta: ${question}
`,
        cs: `
## Especialidade
Você é um assistente estratégico de Counter-Strike.

## Tarefa
Responda sobre mira, mapas, táticas de equipe, economia e posicionamento.

## Regras
- Se não souber, diga "Não sei".
- Se a pergunta não for sobre Counter-Strike, diga "Essa pergunta não está relacionada ao jogo".
- Data de hoje: ${dataHoje}.
- Não invente informações nem afirme que verificou a meta atual se não tiver essa informação.

## Resposta
- Seja direto, com no máximo 200 caracteres.
- Use Markdown.
- Não use saudações nem despedidas.

Pergunta: ${question}
`
    }

    const pergunta = prompts[game]

    if (!pergunta) {
        throw new Error('Jogo não reconhecido. Selecione um jogo da lista.')
    }

    let response

    try {
        response = await fetch(geminiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            signal: AbortSignal.timeout(30000),
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: pergunta }]
                    }
                ]
            })
        })
    } catch (error) {
        if (
            error.name === 'TimeoutError' ||
            error.name === 'AbortError'
        ) {
            throw new Error(
                'A IA demorou mais de 30 segundos para responder. Tente novamente.'
            )
        }

        throw new Error(
            'Não foi possível conectar à API. Verifique sua conexão e tente novamente.'
        )
    }

    let data

    try {
        data = await response.json()
    } catch {
        throw new Error(
            'O Google retornou uma resposta inválida. Tente novamente.'
        )
    }

    if (!response.ok) {
        const mensagens = {
            400: 'A solicitação foi rejeitada. Confira a pergunta e tente novamente.',
            403: 'A API recusou o acesso. Verifique a chave e as permissões do projeto.',
            404: 'O modelo solicitado não foi encontrado ou não está disponível.',
            429: 'A cota ou o limite de uso da API foi excedido. Confira os limites no Google AI Studio.',
            500: 'O serviço da IA apresentou um erro interno. Tente novamente.',
            503: 'O modelo está temporariamente indisponível ou sobrecarregado. Tente novamente mais tarde.'
        }

        throw new Error(
            mensagens[response.status] ||
            data?.error?.message ||
            `Erro da API (HTTP ${response.status}).`
        )
    }

    const texto = data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || '')
        .join('')
        .trim()

    if (!texto) {
        const motivo = data?.promptFeedback?.blockReason

        if (motivo) {
            throw new Error(
                `A pergunta foi bloqueada pela API. Motivo: ${motivo}`
            )
        }

        throw new Error(
            'A IA não retornou texto. Tente reformular sua pergunta.'
        )
    }

    return texto
}

const enviarFormulario = async (event) => {
    event.preventDefault()

    const apiKey = apiKeyInput.value.trim()
    const game = gameSelect.value
    const question = questionInput.value.trim()
    const responseContent =
        aiResponse.querySelector('.response-content')

    if (!apiKey || !game || !question) {
        alert('Por favor, preencha todos os campos.')
        return
    }

    askButton.disabled = true
    askButton.textContent = 'Perguntando...'
    askButton.classList.add('loading')

    aiResponse.classList.remove('hidden')
    responseContent.textContent = 'Consultando a IA...'

    try {
        const text = await perguntarAI(question, game, apiKey)

        responseContent.innerHTML = markdownToHTML(text)
    } catch (error) {
        console.error('Erro ao consultar a API Gemini:', error)

        responseContent.textContent =
            `Não foi possível obter uma resposta: ${error.message}`
    } finally {
        askButton.disabled = false
        askButton.textContent = 'Perguntar'
        askButton.classList.remove('loading')
    }
}

form.addEventListener('submit', enviarFormulario)
