// import fetch from 'isomorphic-unfetch'

declare var Persona

export const personaVerify = (
  id,
  hash,
  fieldValues,
  onCompleteCallback,
  onErrorCallback,
  onCancelCallback
) => {
  if (!id) {
    console.log('persona templateId is invalid!', id)
    return
  }

  const client = new Persona.Client({
    templateId: id,
    environment: 'sandbox',
    onReady: () => client.open(),
    onComplete: ({ inquiryId, status, fields }) => {
      console.log(`Completed inquiry ${inquiryId} with status ${status}`)
      onCompleteCallback(hash, inquiryId, status, fields)
    },
    onCancel: ({ inquiryId, sessionToken }) => {
      console.log(
        `Canceled inquiry ${inquiryId} with sessionToken ${sessionToken}`
      )
      onCancelCallback(hash, inquiryId, sessionToken)
    },
    onError: ({ status, code }) => {
      console.log(`Error inquiry ${status} with code ${code}`)
      onErrorCallback(hash, status, code)
    },
    fields: fieldValues,
  })
}

export const getPersonaInquiry = (apiKey, version, inquiryId) => {
  if (!apiKey || !version || !inquiryId) {
    console.log('Invalid parameters!', apiKey, version, inquiryId)
    return undefined
  }

  const options = {
    method: 'GET',
    headers: {
      mode: 'no-cors',
      'Access-Control-Allow-Origin': '*',
      Accept: 'application/json',
      // Origin: 'https://docs.withpersona.com',
      // Referer: 'https://docs.withpersona.com/',
      // 'Persona-Version': version,
      // 'Persona-Version': '2021-05-14',
      Authorization: `Bearer ${apiKey}`,
    },
  }

  const url = `https://withpersona.com/api/v1/inquiries/${inquiryId}`

  return fetch(url, options)
    .then((response) => response.json())
    .then((response) => {
      console.log('fetch inquiry', response)
      return response as any
    })
    .catch((err) => {
      console.error(err)
      return undefined
    })
}

export const getPersonaVerification = async (
  apiKey,
  version,
  verificationId
) => {
  if (!apiKey || !version || !verificationId) {
    console.log('Invalid parameters!', apiKey, version, verificationId)
    return undefined
  }

  const options = {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Persona-Version': version,
      Authorization: `Bearer ${apiKey}`,
    },
  }

  return await fetch(
    `https://withpersona.com/api/v1/verifications/${verificationId}`,
    options
  )
    .then((response) => response.json())
    .then((response) => {
      console.log('fetch verify', response)
      return response
    })
    .catch((err) => {
      console.error(err)
      return undefined
    })
}
