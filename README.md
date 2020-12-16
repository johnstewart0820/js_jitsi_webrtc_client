### Virtual-Escape-Platform

### FrontEnd

Based on the Fuse React Theme.

To Start:

1) yarn install
2) yarn start

###  Backend

Based on the Laravel 8.X

Configuration:

1) composor install
2) You need to fix the following method on each files.

	1. vendor\socialiteproviders\wordpress\Provider.php
	protected function getAuthUrl($state)
    	{
        	return $this->buildAuthUrlFromBase('https://wpoauthserver.wvmodel.ca/?oauth=authorize', $state);
    	}
	protected function getTokenUrl()
	{
        	return 'https://wpoauthserver.wvmodel.ca/oauth/token';
	}
	protected function getUserByToken($token)
    	{
        	$response = $this->getHttpClient()->get(
            	'https://wpoauthserver.wvmodel.ca/oauth/me',
            	[
                	'headers' => [
                	    'Authorization' => 'Bearer '.$token,
        	        ],
            	]
	        );
        	return json_decode($response->getBody()->getContents(), true);
    	}

	2.vendor\laravel\socialite\src\Two\AbstractProvider.php
	protected function buildAuthUrlFromBase($url, $state)
    	{
        	return $url.'&'.http_build_query($this->getCodeFields($state), '', '&', $this->encodingType);
    	}