$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add('http://localhost:8787/')
$listener.Start()
Write-Output 'Preview URL: http://localhost:8787/'

while ($true) {
  $context = $listener.GetContext()
  $response = $context.Response
  $contentString = 'Mini Program Mine page style preview placeholder'
  $content = [System.Text.Encoding]::UTF8.GetBytes($contentString)
  $response.ContentLength64 = $content.Length
  $response.OutputStream.Write($content, 0, $content.Length)
  $response.OutputStream.Close()
}