package com.hackathon.coldchain.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    // Endpoints that do NOT require a token
    private static final List<String> PUBLIC_POST = List.of(
            "/api/users/login",
            "/api/users"          // register
    );

    public JwtAuthFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path   = request.getRequestURI();
        String method = request.getMethod();

        // Always allow OPTIONS (CORS preflight) and the public POST endpoints
        boolean isPublic = HttpMethod.OPTIONS.name().equals(method)
                || (HttpMethod.POST.name().equals(method) && PUBLIC_POST.stream().anyMatch(path::equals));

        if (isPublic) {
            filterChain.doFilter(request, response);
            return;
        }

        // Check for Bearer token
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            sendUnauthorized(response, "Missing or malformed Authorization header");
            return;
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            sendUnauthorized(response, "Invalid or expired token");
            return;
        }

        // Extract claims
        String username = jwtUtil.extractUsername(token);
        String role     = jwtUtil.extractRole(token);
        Long   userId   = jwtUtil.extractUserId(token);

        // Attach to request attributes for controllers to use
        request.setAttribute("jwtUsername", username);
        request.setAttribute("jwtRole",     role);
        request.setAttribute("jwtUserId",   userId);

        // *** CRITICAL: tell Spring Security this user is authenticated ***
        // Without this, Spring Security still blocks the request with 403
        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                username,
                null,
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
        );
        SecurityContextHolder.getContext().setAuthentication(authToken);

        filterChain.doFilter(request, response);
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\":\"" + message + "\"}");
    }
}
