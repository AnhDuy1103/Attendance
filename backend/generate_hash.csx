#!/usr/bin/env dotnet-script
#r "nuget: BCrypt.Net-Next, 4.0.3"

var password = "Admin@123";
var hash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 11);
Console.WriteLine($"Password: {password}");
Console.WriteLine($"Hash: {hash}");

var isValid = BCrypt.Net.BCrypt.Verify(password, hash);
Console.WriteLine($"Verify OK: {isValid}");
