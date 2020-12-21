<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;
use Config;
class AuthController extends Controller
{
    public function login(Request $request)
    {
        try {
            $name = $request->name;
            $email = $request->email;
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
                'message' => Config::get('constants.messages.success'),
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
