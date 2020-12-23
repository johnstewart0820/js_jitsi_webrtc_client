<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Config;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Client;

class AuthController extends Controller
{
    public $httpClient;

    public function getHttpClient()
    {
        if (is_null($this->httpClient)) {
            $this->httpClient = new Client();
        }

        return $this->httpClient;
    }

    public function user($code)
    {
        $response = $this->getAccessTokenResponse($code);

        $user = $this->getUserByToken(
            $token = Arr::get($response, 'access_token')
        );

        return [
            'name' => $user->user_login,
            'email' => $user->user_email
        ];
    }

    protected function getTokenFields($code)
    {
        return [
            'grant_type' => 'authorization_code',
            'client_id' => env('WORDPRESS_CLIENT_ID'),
            'client_secret' => env('WORDPRESS_CLIENT_SECRET'),
            'code' => $code,
            'redirect_uri' => env('FRONTEND_URL').'/getToken',
        ];
    }

    public function getAccessTokenResponse($code)
    {
        $response = $this->getHttpClient()->post('https://portal.encade.org/oauth/token', [
            'headers' => ['Accept' => 'application/json'],
            'form_params' => $this->getTokenFields($code),
        ]);

        return json_decode($response->getBody(), true);
    }

    public function getUserByToken($token)
    {
        $response = $this->getHttpClient()->get(
            'https://portal.encade.org/oauth/me',
            [
                'headers' => [
                    'Authorization' => 'Bearer '.$token,
                ],
            ]
        );

        return json_decode($response->getBody()->getContents(), true);
    }

    public function login(Request $request)
    {
        $response = $this->user($request->code);
        try {
            $name = $response->name;
            $email = $response->email;
            $password = '123456';
            $count = count(User::where(['email' => $email])->get());
            // registered
            if ($count == 0) {
                $user = new User();
                $user->name = $name;
                $user->email = $email;
                $user->password = bcrypt($password);
                $user->save();
            }
            $token = JWTAuth::attempt(['email' => $email, 'password' => $password]);
            return response()->json([
                'code' => Config::get('constants.codes.success'),
                'message' => Config::get('constants.messages.login_success'),
                'data' => ['token' => $token]
            ]);
        } catch (Exception $e) {
            // Something else happened, completely unrelated to Stripe
            return response()->json([
                'code' => Config::get('constants.codes.server_error'), 
                'message' => Config::get('constants.messages.server_error') 
            ]);
        }
        
    }

    public function validateToken(Request $request)
    {
        try {
            $user = JWTAuth::parseToken()->authenticate();   
            $email = $user->email;
            $password = '123456';
            $token = JWTAuth::attempt(['email' => $email, 'password' => $password]);
            return response()->json([
                'code' => Config::get('constants.codes.success'),
                'message' => Config::get('constants.messages.validate_success'),
                'data' => ['token' => $token]
            ]);
        } catch (Exception $e) {
            // Something else happened, completely unrelated to Stripe
            return response()->json([
                'code' => Config::get('constants.codes.server_error'), 
                'message' => Config::get('constants.messages.server_error') 
            ]);
        }
        
    }
}
